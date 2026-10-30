package com.ordercraft.service;

import com.ordercraft.dto.customer.CustomerRequest;
import com.ordercraft.dto.customer.CustomerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {
    Page<CustomerResponse> getCustomers(String query, Pageable pageable);
    List<CustomerResponse> getAllActiveCustomers();
    CustomerResponse getCustomerById(Long id);
    CustomerResponse createCustomer(CustomerRequest request);
    CustomerResponse updateCustomer(Long id, CustomerRequest request);
    void deleteCustomer(Long id);
}
