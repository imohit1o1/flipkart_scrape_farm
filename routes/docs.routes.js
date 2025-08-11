import express from 'express';

const router = express.Router();

/**
 * API documentation endpoint
 */
router.get('/', (req, res) => {
    res.json({
        service: 'Meesho Master Scraper API',
        version: '1.0.0',
        endpoints: {
            'POST /scrape/manual': {
                description: 'Submit a manual scraping task for Meesho supplier portal',
                request_examples: {
                    'warehouse_does_not_exist': {
                        auth: {
                            identifier: "{{no_warehouse_identifier_1}}",
                            password: "{{no_warehouse_password_1}}",
                            seller_id: "{{no_warehouse_seller_id_1}}",
                            warehouse_exists: false
                        },
                        requested_operations: {
                            operation_mode: "{{operation_mode}}",
                            global_date_range: { // global date range is used for all operations if not specified in the operation
                                start_date: "{{global_start_date}}",
                                end_date: "{{global_end_date}}"
                            },
                            rate_card: { enabled: true },
                            orders_data: {
                                enabled: true,
                                date_range: { // date range is used for orders_data operation if not specified in the operation
                                    start_date: "{{orders_data_start_date}}",
                                    end_date: "{{orders_data_end_date}}"
                                }
                            },
                            return_tracking: {
                                enabled: false,
                                date_range: { // date range is used for return_tracking operation if not specified in the operation
                                    start_date: "{{return_tracking_start_date}}",
                                    end_date: "{{return_tracking_end_date}}"
                                },
                                types: {
                                    intransit_returns: {
                                        enabled: true,
                                        date_range: { // date range is used for intransit_returns operation if not specified in the operation
                                            start_date: "{{intransit_return_tracking_start_date}}",
                                            end_date: "{{intransit_return_tracking_end_date}}"
                                        }
                                    },
                                    delivered_returns: {
                                        enabled: true,
                                        date_range: { // date range is used for delivered_returns operation if not specified in the operation
                                            start_date: "{{delivered_return_tracking_start_date}}",
                                            end_date: "{{delivered_return_tracking_end_date}}"
                                        }
                                    },
                                    lost_returns: {
                                        enabled: true,
                                        date_range: { // date range is used for lost_returns operation if not specified in the operation
                                            start_date: "{{lost_return_tracking_start_date}}",
                                            end_date: "{{lost_return_tracking_end_date}}"
                                        }
                                    }
                                }
                            },
                            payments: {
                                enabled: true,
                                date_range: { // date range is used for payments operation if not specified in the operation
                                    start_date: "{{payments_start_date}}",
                                    end_date: "{{payments_end_date}}"
                                },
                                types: {
                                    gst_report: {
                                        enabled: true,
                                        date_range: { // date range is used for gst_report operation if not specified in the operation
                                            start_date: "{{gst_report_start_date}}",
                                            end_date: "{{gst_report_end_date}}"
                                        }
                                    },
                                    supplier_tax_invoice_report: {
                                        enabled: true,
                                        date_range: { // date range is used for supplier_tax_invoice_report operation if not specified in the operation
                                            start_date: "{{supplier_tax_invoice_report_start_date}}",
                                            end_date: "{{supplier_tax_invoice_report_end_date}}"
                                        }
                                    }
                                },
                                supplier_tax_invoice: {
                                    enabled: true,
                                    date_range: { // date range is used for supplier_tax_invoice operation if not specified in the operation
                                        start_date: "{{supplier_tax_invoice_start_date}}",
                                        end_date: "{{supplier_tax_invoice_end_date}}"
                                    }
                                },
                                payments_to_date: {
                                    enabled: true,
                                    date_range: { // date range is used for payments_to_date operation if not specified in the operation
                                        start_date: "{{payments_to_date_start_date}}",
                                        end_date: "{{payments_to_date_end_date}}"
                                    }
                                }
                            }
                        },
                        notes: [
                            "reports-orders,claims,inventory,returns (not allowed for warehouse_does_not_exist)",
                            "payments_at_order_level (not allowed for warehouse_does_not_exist)"
                        ]
                    },
                    'warehouse_exists': {
                        auth: {
                            identifier: "{{warehouse_identifier_1}}",
                            password: "{{warehouse_password_1}}",
                            seller_id: "{{warehouse_seller_id_1}}",
                            warehouse_exists: true
                        },
                        requested_operations: {
                            operation_mode: "{{operation_mode}}",
                            global_date_range: { // global date range is used for all operations if not specified in the operation
                                start_date: "{{global_start_date}}",
                                end_date: "{{global_end_date}}"
                            },
                            rate_card: { enabled: true },
                            orders_data: {
                                enabled: true,
                                date_range: { // date range is used for orders_data operation if not specified in the operation         
                                    start_date: "{{orders_data_start_date}}",
                                    end_date: "{{orders_data_end_date}}"
                                }
                            },
                            reports: {
                                enabled: true,
                                orders_report: {
                                    enabled: true,
                                    date_range: { // date range is used for orders_report operation if not specified in the operation
                                        start_date: "{{orders_report_start_date}}",
                                        end_date: "{{orders_report_end_date}}"
                                    }
                                },
                                returns_report: {
                                    enabled: true,
                                    date_range: { // date range is used for returns_report operation if not specified in the operation
                                        start_date: "{{returns_report_start_date}}",
                                        end_date: "{{returns_report_end_date}}"
                                    },
                                },
                                claims_report: {
                                    enabled: true,
                                    date_range: { // date range is used for claims_report operation if not specified in the operation
                                        start_date: "{{claims_report_start_date}}",
                                        end_date: "{{claims_report_end_date}}"
                                    }
                                },
                                inventory_report: {
                                    enabled: true,
                                    date_range: { // date range is used for inventory_report operation if not specified in the operation
                                        start_date: "{{inventory_report_start_date}}",
                                        end_date: "{{inventory_report_end_date}}"
                                    }
                                }
                            },
                            return_tracking: {
                                enabled: true,
                                date_range: { // date range is used for return_tracking operation if not specified in the operation
                                    start_date: "{{return_tracking_start_date}}",
                                    end_date: "{{return_tracking_end_date}}"
                                },
                                types: {
                                    intransit_returns: {
                                        enabled: true,
                                        date_range: { // date range is used for intransit_returns operation if not specified in the operation
                                            start_date: "{{intransit_return_tracking_start_date}}",
                                            end_date: "{{intransit_return_tracking_end_date}}"
                                        }
                                    },
                                    delivered_returns: {
                                        enabled: true,
                                        date_range: { // date range is used for delivered_returns operation if not specified in the operation
                                            start_date: "{{delivered_return_tracking_start_date}}",
                                            end_date: "{{delivered_return_tracking_end_date}}"
                                        }
                                    },
                                    lost_returns: {
                                        enabled: true,
                                        date_range: { // date range is used for lost_returns operation if not specified in the operation
                                            start_date: "{{lost_return_tracking_start_date}}",
                                            end_date: "{{lost_return_tracking_end_date}}"
                                        }
                                    }
                                }
                            },
                            payments: {
                                enabled: true,
                                date_range: { // date range is used for payments operation if not specified in the operation
                                    start_date: "{{payments_start_date}}",
                                    end_date: "{{payments_end_date}}"
                                },
                                types: {
                                    gst_report: {
                                        enabled: true,
                                        date_range: { // date range is used for gst_report operation if not specified in the operation
                                            start_date: "{{gst_report_start_date}}",
                                            end_date: "{{gst_report_end_date}}"
                                        },
                                        supplier_tax_invoice: {
                                            enabled: true,
                                            date_range: { // date range is used for supplier_tax_invoice operation if not specified in the operation
                                                start_date: "{{supplier_tax_invoice_start_date}}",
                                                end_date: "{{supplier_tax_invoice_end_date}}"
                                            }
                                        },
                                        payments_to_date: {
                                            enabled: true,
                                            date_range: { // date range is used for payments_to_date operation if not specified in the operation        
                                                start_date: "{{payments_to_date_start_date}}",
                                                end_date: "{{payments_to_date_end_date}}"
                                            }
                                        },
                                        payments_at_order_level: {
                                            enabled: true,
                                            date_range: { // date range is used for payments_at_order_level operation if not specified in the operation
                                                start_date: "{{payments_at_order_level_start_date}}",
                                                end_date: "{{payments_at_order_level_end_date}}"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        response: {
                            jobId: "{{job_id}}",
                            status: "in_progress",
                            statusEndpoint: "/jobs/{jobId}/status"
                        },
                        notes: [
                            "All operations are available for warehouse_exists accounts",
                            "Global date range is used for all operations if not specified in the operation",
                            "Individual date ranges can override global date range for specific operations"
                        ]
                    },
                    'POST /scrape/bulk': {
                        description: 'Submit bulk scraping tasks for multiple Meesho supplier accounts',
                        request_example: {
                            auth: [
                                {
                                    identifier: "{{test_identifier_1}}",
                                    password: "{{test_password_1}}",
                                    seller_id: "{{test_seller_id_1}}",
                                    warehouse_exists: false
                                },
                                {
                                    identifier: "{{test_identifier_2}}",
                                    password: "{{test_password_2}}",
                                    seller_id: "{{test_seller_id_2}}",
                                    warehouse_exists: true
                                }
                            ],
                            requested_operations: {
                                operation_mode: "{{operation_mode}}",
                                global_date_range: { // global date range is used for all operations if not specified in the operation
                                    start_date: "{{global_start_date}}",
                                    end_date: "{{global_end_date}}"
                                },
                                rate_card: { enabled: true },
                                orders_data: {
                                    enabled: true,
                                    date_range: { // date range is used for orders_data operation if not specified in the operation     
                                        start_date: "{{orders_data_start_date}}",
                                        end_date: "{{orders_data_end_date}}"
                                    }
                                },
                                // ... (same as manual endpoint, can include reports, return_tracking, payments, etc.)
                            },
                        },
                        response: {
                            tasks: [
                                { jobId: "{{job_id_1}}", status: "in_progress" },
                                { jobId: "{{job_id_2}}", status: "in_progress" }
                            ]
                        },
                        notes: [
                            "Bulk endpoint accepts array of auth objects",
                            "Same operation structure as manual endpoint",
                            "Each auth object will create a separate scraping task"
                        ]
                    },
                    'GET /jobs/:jobId/status': {
                        api_description: 'Get job status and results',
                        response: {
                            jobId: "",
                            status: "",
                            status_description: "0/1 operations completed",
                            stage: "completed",
                            stage_description: "All operations completed successfully",
                            percentComplete: 100,
                            last_updated_at: "",
                            result: {
                                trackingFile: "{identifier}.json"
                            }
                        },
                        notes: [
                            "Use jobId from POST /scrape/manual or POST /scrape/bulk response",
                            "Status updates in real-time as operations complete",
                            "Result contains download links when operations complete"
                        ]
                    },
                    'GET /system-info': {
                        description: 'Get system information and concurrency recommendations',
                        notes: [
                            "Returns system load and recommended concurrency limits",
                            "Useful for optimizing bulk request sizes"
                        ]
                    },
                    'GET /health': {
                        description: 'Health check endpoint',
                        notes: [
                            "Simple health check to verify API is running"
                        ]
                    }
                },
            }
        }
    });
});

export { router as mainDocsRouter }; 