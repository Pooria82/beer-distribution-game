export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidOrderError extends DomainError {
  readonly code = 'INVALID_ORDER';
  readonly statusCode = 400;

  constructor(message = 'Order must be a non-negative integer') {
    super(message);
  }
}

export class RoundAlreadySubmittedError extends DomainError {
  readonly code = 'ROUND_ALREADY_SUBMITTED';
  readonly statusCode = 409;

  constructor(message = 'Player has already placed an order for this round') {
    super(message);
  }
}

export class GameFinishedError extends DomainError {
  readonly code = 'GAME_FINISHED';
  readonly statusCode = 400;

  constructor(message = 'Cannot perform action: game is already completed') {
    super(message);
  }
}

export class GameNotStartedError extends DomainError {
  readonly code = 'GAME_NOT_STARTED';
  readonly statusCode = 400;

  constructor(message = 'Cannot perform action: waiting for all roles to be occupied') {
    super(message);
  }
}

export class RoleAlreadyTakenError extends DomainError {
  readonly code = 'ROLE_ALREADY_TAKEN';
  readonly statusCode = 409;

  constructor(role: string) {
    super(`Role "${role}" is already occupied in this game`);
  }
}

export class GameNotFoundError extends DomainError {
  readonly code = 'GAME_NOT_FOUND';
  readonly statusCode = 404;

  constructor(gameId: string) {
    super(`Game with ID "${gameId}" was not found`);
  }
}

export class UnauthorizedPlayerError extends DomainError {
  readonly code = 'UNAUTHORIZED_PLAYER';
  readonly statusCode = 403;

  constructor(message = 'Invalid player token or role access denied') {
    super(message);
  }
}
