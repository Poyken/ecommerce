/**
 * =====================================================================
 * USE CASE INTERFACE - Application Layer Contract
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * Use Cases (also known as Interactors) orchestrate the flow of data
 * to and from entities, and direct those entities to use their
 * business rules to achieve the goals of the use case.
 *
 * Key Principles:
 * 1. Single Responsibility - One use case, one action
 * 2. Input/Output DTOs - Clear boundaries
 * 3. Framework Independence - No NestJS dependencies
 */

import { Result } from './result';

/**
 * Base interface for all use cases
 * TInput: The input DTO
 * TOutput: The output DTO (success case)
 * TError: The error type (default: Error)
 */
export interface IUseCase<TInput, TOutput, TError = Error> {
  execute(input: TInput): Promise<Result<TOutput, TError>>;
}

/**
 * Use case with no input
 */
export interface IQueryUseCase<TOutput, TError = Error> {
  execute(): Promise<Result<TOutput, TError>>;
}

/**
 * Use case execution context (optional metadata)
 */
export interface UseCaseContext {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  permissions?: string[];
}

/**
 * Base abstract class for use cases with context
 */
export abstract class UseCase<
  TInput,
  TOutput,
  TError = Error,
> implements IUseCase<TInput, TOutput, TError> {
  protected context?: UseCaseContext;

  withContext(context: UseCaseContext): this {
    this.context = context;
    return this;
  }

  abstract execute(input: TInput): Promise<Result<TOutput, TError>>;
}

/**
 * Query use case (read-only operations)
 */
export abstract class QueryUseCase<
  TInput,
  TOutput,
  TError = Error,
> implements IUseCase<TInput, TOutput, TError> {
  protected context?: UseCaseContext;

  withContext(context: UseCaseContext): this {
    this.context = context;
    return this;
  }

  abstract execute(input: TInput): Promise<Result<TOutput, TError>>;
}

/**
 * Command use case (write operations)
 */
export abstract class CommandUseCase<
  TInput,
  TOutput,
  TError = Error,
> implements IUseCase<TInput, TOutput, TError> {
  protected context?: UseCaseContext;

  withContext(context: UseCaseContext): this {
    this.context = context;
    return this;
  }

  abstract execute(input: TInput): Promise<Result<TOutput, TError>>;
}
