package com.ordercraft.service;

import com.ordercraft.dto.product.ProductRequest;
import com.ordercraft.dto.product.ProductResponse;
import com.ordercraft.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    Page<ProductResponse> getProducts(String query, Pageable pageable);
    List<ProductResponse> getProductsByCategory(Product.Category category);
    List<ProductResponse> getAllActiveProducts();
    ProductResponse getProductById(Long id);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
