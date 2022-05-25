import fs from "fs";
import { parse } from "csv-parse";
import { ICategoriesRepository } from "../../repositories/ICategoriesRepository";

interface IImportCategory {
  name: string;
  description: string;
}

export class ImportCategoryUseCase {
  constructor(private categoryRepository: ICategoriesRepository) {}

  loadCategories(file: Express.Multer.File): Promise<IImportCategory[]> {
    return new Promise((resolve, reject) => {
      const categories: IImportCategory[] = [];

      const stream = fs.createReadStream(file.path);

      const parserFile = parse();

      stream.pipe(parserFile);

      parserFile
        .on("data", async (chunk) => {
          const [name, description] = chunk;

          categories.push({ name, description });
        })
        .on("end", () => {
          fs.promises.unlink(file.path);
          resolve(categories);
        })
        .on("error", (error) => {
          console.log(error);
          reject(error);
        });
    });
  }

  async execute(file: Express.Multer.File) {
    const categories = await this.loadCategories(file);
    Promise.all(
      categories.map(async (category) => {
        const categoryAlreadyExists = this.categoryRepository.findByName(
          category.name
        );

        if (!categoryAlreadyExists) {
          this.categoryRepository.create(category);
        }
      })
    );
  }
}
