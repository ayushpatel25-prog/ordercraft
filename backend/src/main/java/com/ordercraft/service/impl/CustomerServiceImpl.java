package com.ordercraft.service.impl;

import com.ordercraft.dto.customer.CustomerRequest;
import com.ordercraft.dto.customer.CustomerResponse;
import com.ordercraft.entity.Customer;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.CustomerRepository;
import com.ordercraft.repository.SalesOrderRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getCustomers(String query, Pageable pageable) {
        Page<Customer> page = (query != null && !query.trim().isEmpty())
                ? customerRepository.searchCustomers(query.trim(), pageable)
                : customerRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllActiveCustomers() {
        return customerRepository.findByStatus("ACTIVE").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        Customer customer = Customer.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .status("ACTIVE")
                .build();

        Customer saved = customerRepository.save(customer);
        auditService.log("CUSTOMER_CREATED", "Customer", saved.getId().toString(), null, "Created: " + saved.getName());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        customer.setName(request.getName().trim());
        customer.setEmail(request.getEmail().trim());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPostalCode(request.getPostalCode());
        if (request.getStatus() != null) {
            customer.setStatus(request.getStatus());
        }

        Customer saved = customerRepository.save(customer);
        auditService.log("CUSTOMER_UPDATED", "Customer", saved.getId().toString(), null, "Updated: " + saved.getName());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        customer.setStatus("INACTIVE");
        customerRepository.save(customer);
        auditService.log("CUSTOMER_DEACTIVATED", "Customer", id.toString(), "ACTIVE", "INACTIVE");
    }

    private CustomerResponse toResponse(Customer c) {
        long orderCount = salesOrderRepository.findByCustomerId(c.getId()).size();
        return CustomerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .city(c.getCity())
                .state(c.getState())
                .postalCode(c.getPostalCode())
                .status(c.getStatus())
                .totalOrdersCount(orderCount)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
