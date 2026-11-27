import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/require-permission.js';
import { validateBody } from '../middleware/validate.js';
import { createCategorySchema, createProductSchema, productListQuerySchema, updateProductSchema } from '../schemas/product.schemas.js';
import { createProduct, getProduct, listProductCategories, listProducts, updateProduct, createProductCategory } from '../services/product.service.js';

export const productRouter = Router();
productRouter.use(authenticate);

productRouter.get('/categories', async (request, response, next) => {
  try {
    const categories = await listProductCategories(request.auth!.organizationId);
    response.json({ success: true, data: { categories } });
  } catch (error) { next(error); }
});

productRouter.post('/categories', requirePermission('products:configure'), validateBody(createCategorySchema), async (request, response, next) => {
  try {
    const category = await createProductCategory(request.body, request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.status(201).json({ success: true, data: { category } });
  } catch (error) { next(error); }
});

productRouter.get('/', requirePermission('products:read'), async (request, response, next) => {
  try {
    const parsed = productListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Product query parameters are invalid.', details: parsed.error.flatten().fieldErrors } });
      return;
    }
    const result = await listProducts(parsed.data, request.auth!.organizationId);
    response.json({ success: true, data: result });
  } catch (error) { next(error); }
});

productRouter.post('/', requirePermission('products:write'), validateBody(createProductSchema), async (request, response, next) => {
  try {
    const product = await createProduct(request.body, request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.status(201).json({ success: true, data: { product } });
  } catch (error) { next(error); }
});

productRouter.get('/:identifier', requirePermission('products:read'), async (request, response, next) => {
  try {
    const product = await getProduct(request.params.identifier, request.auth!.organizationId);
    response.json({ success: true, data: { product } });
  } catch (error) { next(error); }
});

productRouter.patch('/:identifier', requirePermission('products:write'), validateBody(updateProductSchema), async (request, response, next) => {
  try {
    const product = await updateProduct(request.params.identifier, request.body, request.auth!.organizationId, request.auth!.userId, request.requestId);
    response.json({ success: true, data: { product } });
  } catch (error) { next(error); }
});
