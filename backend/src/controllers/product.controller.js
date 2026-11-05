import productService from '#services/product.service.js';
import ApiResponse from '#utils/ApiResponse.js';

export const getCatalog = async (req, res) => {
  const result = await productService.getCatalog(req.query);
  res.status(200).json(new ApiResponse(200, result));
};

export const getBestSellers = async (req, res) => {
  const products = await productService.getBestSellers(req.query.limit);
  res.status(200).json(new ApiResponse(200, products));
};

export const getBySlug = async (req, res) => {
  const product = await productService.getBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, product));
};

export const create = async (req, res) => {
  const imageUrls = (req.files ?? []).map((f) => f.path);
  const product = await productService.create(req.body, imageUrls);
  res.status(201).json(new ApiResponse(201, product, "Mahsulot qo'shildi"));
};

export const update = async (req, res) => {
  const imageUrls = (req.files ?? []).map((f) => f.path);
  const product = await productService.update(req.params.id, req.body, imageUrls);
  res.status(200).json(new ApiResponse(200, product, 'Mahsulot yangilandi'));
};

export const remove = async (req, res) => {
  const { archived } = await productService.remove(req.params.id);
  const message = archived
    ? "Mahsulot tarixda ishlatilgan, arxivga o'tkazildi"
    : "Mahsulot o'chirildi";
  res.status(200).json(new ApiResponse(200, { archived }, message));
};
