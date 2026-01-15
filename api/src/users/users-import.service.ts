import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersImportService {
  private readonly logger = new Logger(UsersImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateTemplate(res: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    worksheet.columns = [
      { header: 'Email (*)', key: 'email', width: 30 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Roles (Comma separated)', key: 'roles', width: 30 },
      { header: 'Status (ACTIVE/INACTIVE)', key: 'status', width: 15 },
    ];

    worksheet.addRow({
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: 'USER, STAFF',
      status: 'ACTIVE',
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users_import_template.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async importFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('Invalid Excel file');
    }

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const getString = (val: ExcelJS.CellValue) => {
        if (val === null || val === undefined) return undefined;
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      };

      const rowData = {
        email: getString(row.getCell(1).value),
        firstName: getString(row.getCell(2).value),
        lastName: getString(row.getCell(3).value),
        roles: getString(row.getCell(4).value),
        status: getString(row.getCell(5).value) || 'ACTIVE',
      };
      if (rowData.email) {
        rows.push(rowData);
      }
    });

    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [] as { email: string; error: any }[],
    };

    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context required');

    // Cache roles
    const allRoles = await this.prisma.role.findMany({
      where: { tenantId: tenant.id },
    });
    const roleMap = new Map(allRoles.map((r) => [r.name.toUpperCase(), r.id]));

    for (const row of rows) {
      try {
        // Handle Roles
        const roleNames = row.roles
          ? row.roles.split(',').map((r: string) => r.trim().toUpperCase())
          : ['USER'];
        const roleIds: string[] = [];
        for (const name of roleNames) {
          const rid = roleMap.get(name);
          if (rid) roleIds.push(rid);
        }

        const salt = await bcrypt.genSalt();
        const defaultPasswordHash = await bcrypt.hash('password@123', salt);

        // Upsert User
        await this.prisma.$transaction(async (tx) => {
          const user = await tx.user.upsert({
            where: {
              tenantId_email: {
                tenantId: tenant.id,
                email: row.email,
              },
            },
            update: {
              firstName: row.firstName,
              lastName: row.lastName,
              // Password is NOT updated during import for security
              deletedAt: row.status === 'INACTIVE' ? new Date() : null,
            },
            create: {
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              password: defaultPasswordHash,
              tenantId: tenant.id,
              deletedAt: row.status === 'INACTIVE' ? new Date() : null,
            },
          });

          // Update Roles
          if (roleIds.length > 0) {
            await tx.userRole.deleteMany({ where: { userId: user.id } });
            await tx.userRole.createMany({
              data: roleIds.map((rid) => ({
                userId: user.id,
                roleId: rid,
              })),
            });
          }
        });

        results.success++;
      } catch (error) {
        this.logger.error(`Import error for ${row.email}: ${error.message}`);
        results.failed++;
        results.errors.push({ email: row.email, error: error.message });
      }
    }

    return results;
  }

  async previewFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('Invalid Excel file');
    }

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const getString = (val: ExcelJS.CellValue) => {
        if (val === null || val === undefined) return undefined;
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      };

      const rowData = {
        email: getString(row.getCell(1).value),
        firstName: getString(row.getCell(2).value),
        lastName: getString(row.getCell(3).value),
        roles: getString(row.getCell(4).value),
        status: getString(row.getCell(5).value) || 'ACTIVE',
      };
      if (rowData.email) {
        rows.push(rowData);
      }
    });

    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context required');

    const allRoles = await this.prisma.role.findMany({
      where: { tenantId: tenant.id },
    });
    const roleMap = new Map(allRoles.map((r) => [r.name.toUpperCase(), r.id]));

    // Check existing users for duplicate/update status
    const emails = rows.map((r) => r.email).filter(Boolean);
    const existingUsers = await this.prisma.user.findMany({
      where: {
        tenantId: tenant.id,
        email: { in: emails },
      },
      select: { email: true },
    });
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const previewRows = rows.map((row) => {
      const errors: string[] = [];
      const isUpdate = existingEmails.has(row.email);

      // Basic Validations
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!row.email || !emailRegex.test(row.email)) {
        errors.push('Invalid email format');
      }

      if (!row.firstName || !row.firstName.trim()) {
        errors.push('First name required');
      }

      if (!row.lastName || !row.lastName.trim()) {
        errors.push('Last name required');
      }

      const roleNames = row.roles
        ? row.roles.split(',').map((r: string) => r.trim().toUpperCase())
        : ['USER'];

      const invalidRoles = roleNames.filter(
        (r: string) => !roleMap.has(r) && r !== 'USER',
      );
      if (invalidRoles.length > 0) {
        errors.push(`Invalid roles: ${invalidRoles.join(', ')}`);
      }

      return {
        ...row,
        isValid: errors.length === 0,
        errors,
        status: isUpdate ? 'Update' : 'Create',
      };
    });

    return {
      total: previewRows.length,
      valid: previewRows.filter((r) => r.isValid).length,
      invalid: previewRows.filter((r) => !r.isValid).length,
      rows: previewRows,
    };
  }
}
