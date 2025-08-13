```jsonc
{
    "job_id": "",
    "operation_mode": "auto | request | download",
    "steps_in_progress": "request | download", // which one is in_progress now
    "status": "enqeued | in_progress | completed | failed | retrying",
    "auth": {
        "identifier": "",
        "password": "",
        "seller_id": "",
        "otp_login": true,
        "client_ip": ""
    },
    "timestamps": {
        "enqueued_at": {
            "date": "dd-mm-yy",
            "time": "hh-mm" // 24hr format
        },
        "started_at": {
            "date": "dd-mm-yy",
            "time": "hh-mm" // 24hr format
        },
        "completed_at": {
            "date": "dd-mm-yy",
            "time": "hh-mm" // 24hr format
        }
    },
    "requested_operations": {
        "all": {
            "enabled": true
        },
        "reports": {
            "listings": {
                "enabled": true,
                "steps": [
                    {
                        "warehouse_location": "WH001",
                        "phase": "request",
                        "status": "pending | in_progress | completed",
                        "attempts": 0,
                        "error": null
                    },
                    {
                        "warehouse_location": "WH001",
                        "phase": "download",
                        "status": "pending | in_progress | completed",
                        "attempts": 1,
                        "scheduled_for": {
                            "date": "dd-mm-yy",
                            "time": "hh-mm" // 24hr format
                        },
                        "error": null
                    }
                ]
            },
            "inventory_report": { // direct download operation no request steps and no scheduled for
                "enabled": true,
                "steps": [
                    {
                        "warehouse_location": "WH001",
                        "phase": "direct_download",
                        "status": "pending | in_progress | completed",
                        "attempts": 1,
                        "scheduled_for": null,
                        "error": null
                    },
                    {
                        "warehouse_location": "WH002",
                        "phase": "direct_download",
                        "status": "pending | in_progress | completed",
                        "attempts": 1,
                        "scheduled_for": null,
                        "error": null
                    }
                ]
            },
            "orders_report": { // direct download operation no request steps and no scheduled for
                "enabled": true,
                "types": {
                    "dispatched_orders_report": {
                        "enabled": true,
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH002",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            },
                            {
                                "warehouse_location": "WH002",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 2.1,
                                "uploaded_at": "2025-08-04T23:32:15.000Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "completed_orders_report": {
                        "enabled": true,
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH002",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            },
                            {
                                "warehouse_location": "WH002",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 2.1,
                                "uploaded_at": "2025-08-04T23:32:15.000Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "upcoming_orders_report": {
                        "enabled": true,
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH002",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            },
                            {
                                "warehouse_location": "WH002",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 2.1,
                                "uploaded_at": "2025-08-04T23:32:15.000Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "returns_orders_report": {
                        "enabled": true,
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "cancelled_orders_report": { // direct download operation no request steps and no scheduled for
                        "enabled": true,
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH002",
                                "phase": "direct_download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": null,
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            },
                            {
                                "warehouse_location": "WH002",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 2.1,
                                "uploaded_at": "2025-08-04T23:32:15.000Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    }
                }
            },
            "fulfilment_report": {
                "enabled": true,
                "types": {
                    "fulfilment_return_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        },
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    }
                }
            },
            "payment_report": {
                "enabled": true,
                "types": {
                    "financial_yearly_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        },
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "settled_transaction_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        },
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    }
                }
            },
            "tax_report": {
                "enabled": true,
                "types": {
                    "gst_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        },
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "sales_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        },
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    },
                    "tds_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        },
                        "steps": [
                            {
                                "warehouse_location": "WH001",
                                "phase": "request",
                                "status": "pending | in_progress | completed",
                                "attempts": 0,
                                "error": null
                            },
                            {
                                "warehouse_location": "WH001",
                                "phase": "download",
                                "status": "pending | in_progress | completed",
                                "attempts": 1,
                                "scheduled_for": {
                                    "date": "dd-mm-yy",
                                    "time": "hh-mm" // 24hr format
                                },
                                "error": null
                            }
                        ],
                        "files": [
                            {
                                "warehouse_location": "WH001",
                                "file_name": "start_date_to_end_date__sanitized_identifier__report_type.csv",
                                "file_size_in_mb": 1.4,
                                "uploaded_at": "2025-08-04T23:31:26.471Z",
                                "download_url": "https://api.flipkart.net/storage/reports/R-12E106AD2ADF6C94F483AE83/data?x_secret_key=1z%2FLpQt191aYhgsDh9LpAf58qi3BMvZ7wa7mIEe8wH0%3D",
                                "storj_url": "https://link.storjshare.io/raw/juee4woct7eaxxqhoewn6i7dwmyq/flipkart-reports/seller_id/start_date_to_end_date/filename"
                            }
                        ]
                    }
                }
            }
        }
    },
    "progress": {
        "overall": {
            "percent_complete": 100,
            "status": "completed"
        },
        "by_phase": {
            "request": { 
                "completed": 0, 
                "total": 0, 
                "applicable": false
            },
            "download": { 
                "completed": 5, 
                "total": 5,
                "applicable": true
            }
        }
    }
}