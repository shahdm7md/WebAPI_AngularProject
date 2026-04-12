namespace API.Contracts.Categories;

public record CategoryResponse(int Id, string Name);
public record CreateCategoryRequest(string Name);