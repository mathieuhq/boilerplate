import type { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import type { GetSessionUseCase } from "../../application/use-cases/get-session.use-case";

export class AuthController {
  constructor(
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  async getSession() {
    const result = await this.getSessionUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async getCurrentUser() {
    const result = await this.getCurrentUserUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
