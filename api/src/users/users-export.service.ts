import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class UsersExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(res: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'Email (*)', key: 'email', width: 30 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Roles (Comma separated)', key: 'roles', width: 30 },
      { header: 'Status (ACTIVE/INACTIVE)', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const batchSize = 100;
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const users = await this.prisma.user.findMany({
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        worksheet.addRow({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles?.join(', ') || 'USER',
          status: user.deletedAt ? 'INACTIVE' : 'ACTIVE',
        });
      }

      cursor = users[users.length - 1].id;
      if (users.length < batchSize) {
        hasMore = false;
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `users-export-${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
