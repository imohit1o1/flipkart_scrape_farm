## Manual request

``` jsonc 
{
    "auth": {
        "identifier": "",
        "password": "",
        "seller_id": "",
        "otp_login": true
    },
    "requested_operations": {
        "operation_mode": "auto|request|download",
        "parameters": {
            "start_date": "",
            "end_date": ""
        },
        "reports": {
            "listings": { "enabled": true },
            "inventory_report": { "enabled": true },

            "orders_report": {
                "enabled": true,
                "types": {
                    "dispatched_orders_report": { "enabled": true },
                    "completed_orders_report": { "enabled": true },
                    "upcoming_orders_report": { "enabled": true },
                    "returns_orders_report": { "enabled": true },
                    "cancelled_orders_report": { "enabled": true }
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
                        }
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
                        }
                    },
                    "settled_transaction_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        }
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
                        }
                    },
                    "sales_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        }
                    },
                    "tds_report": {
                        "enabled": true,
                        "parameters": {
                            "start_date": "",
                            "end_date": ""
                        }
                    }
                }
            }
        }
    }
}
```

**📝 Notes:**
- **Parameter Inheritance**: Parent `parameters` (start_date, end_date) automatically inherit to child reports if not specified
- **Report Types**: Some reports have sub-types (like orders_report) while others are simple (like listings)
- **Individual Parameters**: Reports can override parent parameters by specifying their own `parameters` object


## if users want to scrape all reports then
```json
{
    "auth": {
        "identifier": "",
        "password": "",
        "seller_id": "",
        "otp_login": true
    },
    "requested_operations": {
        "operation_mode": "auto|request|download",
        "parameters": {
            "start_date": "",
            "end_date": ""
        },
        "all": {"enabled": true},  // ✅ Enables ALL available reports automatically
    }
}
```

**📝 Notes:**
- **Global All**: When `"all": {"enabled": true}`, all available reports are automatically enabled
- **Parameter Inheritance**: Global parameters (start_date, end_date) apply to all reports
- **Simplified Request**: No need to specify individual reports when using global "all"


## Bulk request

``` jsonc 
[
    {
        "auth": {
            "identifier": "",
            "password": "",
            "seller_id": "",
            "otp_login": true
        },
        "requested_operations": {
            "all": {"enabled": true},  // ✅ Global all for bulk operations
            "operation_mode": "auto|request|download",
            "parameters": {
                "start_date": "",
                "end_date": ""
            },
            "reports": {
                "listings": { "enabled": true },
                "inventory_report": { "enabled": true },

                "orders_report": {
                    "enabled": true,
                    "types": {
                        "dispatched_orders_report": { "enabled": true },
                        "completed_orders_report": { "enabled": true },
                        "upcoming_orders_report": { "enabled": true },
                        "returns_orders_report": { "enabled": true },
                        "cancelled_orders_report": { "enabled": true }
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
                            }
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
                            }
                        },
                        "settled_transaction_report": {
                            "enabled": true,
                            "parameters": {
                                "start_date": "",
                                "end_date": ""
                            }
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
                            }
                        },
                        "sales_report": {
                            "enabled": true,
                            "parameters": {
                                "start_date": "",
                                "end_date": ""
                            }
                        },
                        "tds_report": {
                            "enabled": true,
                            "parameters": {
                                "start_date": "",
                                "end_date": ""
                            }
                        }
                    }
                }
            }
        }
    },
    {
        "auth": {
            "identifier": "",
            "password": "",
            "seller_id": "",
            "otp_login": false
        },
        "requested_operations": {
            "all": {"enabled": true},  // ✅ Global all for bulk operations
            "operation_mode": "auto|request|download",
            "parameters": {
                "start_date": "",
                "end_date": ""
            },
            "reports": {
                "listings": { "enabled": true },
                "inventory_report": { "enabled": true },

                "orders_report": {
                    "enabled": true,
                    "types": {
                        "dispatched_orders_report": { "enabled": true },
                        "completed_orders_report": { "enabled": true },
                        "upcoming_orders_report": { "enabled": true },
                        "returns_orders_report": { "enabled": true },
                        "cancelled_orders_report": { "enabled": true }
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
                            }
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
                            }
                        },
                        "settled_transaction_report": {
                            "enabled": true,
                            "parameters": {
                                "start_date": "",
                                "end_date": ""
                            }
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
                            }
                        },
                        "sales_report": {
                            "enabled": true,
                            "parameters": {
                                "start_date": "",
                                "end_date": ""
                            }
                        },
                        "tds_report": {
                            "enabled": true,
                            "parameters": {
                                "start_date": "",
                                "end_date": ""
                            }
                        }
                    }
                }
            }
        }
    }
]
```

**📝 Notes:**
- **Bulk Operations**: Array of multiple user requests
- **Global All**: Each user can use `"all": {"enabled": true}` for all reports
- **Parameter Inheritance**: Global parameters apply to all reports unless overridden
- **Individual Control**: Users can still specify individual reports if needed


## if all users want to scrape all reports in bulk then
```json
[{
    "auth": {
        "identifier": "",
        "password": "",
        "seller_id": "",
        "otp_login": true
    },
    "requested_operations": {
        "operation_mode": "auto|request|download",
        "parameters": {
            "start_date": "",
            "end_date": ""
        },
        "all": {"enabled": true},  // ✅ Enables ALL reports for ALL users in bulk
    }
}]
```

**📝 Notes:**
- **Simplified Bulk**: When all users need all reports, use global "all" for maximum efficiency
- **Parameter Inheritance**: Single date range applies to all users and all reports
- **Minimal Payload**: Cleanest possible bulk request structure
