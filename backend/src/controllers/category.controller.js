import categoryService from '#services/category.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const getAll = async (req, res) => {
  const categories = await categoryService.getAll();
  res.status(200).json(new ApiResponse(200, categories));
};

export const create = async (req, res) => {
  const category = await categoryService.create(req.body);
  res.status(201).json(new ApiResponse(201, category, "Kategoriya qo'shildi"));
};

export const update = async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, category, 'Kategoriya yangilandi'));
};

export const remove = async (req, res) => {
  await categoryService.remove(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Kategoriya o'chirildi"));
};
