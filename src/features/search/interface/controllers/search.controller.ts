import type { GlobalSearchInputDTO } from "../../application/dto/search.dto";
import type { GlobalSearchUseCase } from "../../application/use-cases/global-search.use-case";

export class SearchController {
  constructor(private readonly globalSearchUseCase: GlobalSearchUseCase) {}

  async search(input: GlobalSearchInputDTO) {
    const result = await this.globalSearchUseCase.execute(input);

    return result.unwrap();
  }
}
