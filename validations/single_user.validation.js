import { body } from 'express-validator';

const singleUserValidation = () => {
    return [
        // Auth object validation
        body('auth')
            .exists({ checkNull: true }).withMessage('auth object is required')
            .bail()
            .isObject().withMessage('auth must be an object'),

        body('auth.seller_id')
            .exists({ checkNull: true }).withMessage('auth.seller_id is required')
            .bail()
            .isString().withMessage('auth.seller_id must be a string')
            .bail()
            .notEmpty().withMessage('auth.seller_id cannot be empty'),

        body('auth.identifier')
            .exists({ checkNull: true }).withMessage('auth.identifier is required')
            .bail()
            .isString().withMessage('auth.identifier must be a string')
            .bail()
            .notEmpty().withMessage('auth.identifier cannot be empty'),

        body('auth.otp_login')
            .exists({ checkNull: true }).withMessage('auth.otp_login is required')
            .bail()
            .isBoolean().withMessage('auth.otp_login must be a boolean')
            .toBoolean(),

        // Password required when otp_login is false
        body('auth.password')
            .if((value, { req }) => req.body?.auth?.otp_login === false)
            .exists({ checkNull: true }).withMessage('auth.password is required when otp_login is false')
            .bail()
            .isString().withMessage('auth.password must be a string')
            .bail()
            .notEmpty().withMessage('auth.password cannot be empty'),

        // Requested operations validation
        body('requested_operations')
            .exists({ checkNull: true }).withMessage('requested_operations object is required')
            .bail()
            .isObject().withMessage('requested_operations must be an object'),

        body('requested_operations.operation_mode')
            .exists({ checkNull: true }).withMessage('operation_mode is required')
            .bail()
            .isString().withMessage('operation_mode must be a string')
            .bail()
            .isIn(['auto', 'request', 'download']).withMessage('operation_mode must be one of: auto, request, download'),

        // Global parameters validation
        body('requested_operations.parameters')
            .exists({ checkNull: true }).withMessage('parameters object is required')
            .bail()
            .isObject().withMessage('parameters must be an object'),

        body('requested_operations.parameters.start_date')
            .exists({ checkNull: true }).withMessage('start_date is required')
            .bail()
            .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('start_date must be in yyyy-mm-dd format'),

        body('requested_operations.parameters.end_date')
            .exists({ checkNull: true }).withMessage('end_date is required')
            .bail()
            .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('end_date must be in yyyy-mm-dd format')
            .custom((end, { req }) => {
                const start = req?.body?.requested_operations?.parameters?.start_date;
                if (start && end && new Date(end) < new Date(start)) {
                    throw new Error('end_date must be greater than or equal to start_date');
                }
                return true;
            }),

        // Global all option validation (optional)
        body('requested_operations.all.enabled')
            .optional()
            .isBoolean().withMessage('all.enabled must be a boolean')
            .toBoolean(),

        // Reports validation (required when all is not enabled)
        body('requested_operations.reports')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .exists({ checkNull: true }).withMessage('reports object is required when all is not enabled')
            .bail()
            .isObject().withMessage('reports must be an object'),

        // Simple reports validation
        body('requested_operations.reports.listings')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .optional()
            .isObject().withMessage('listings must be an object')
            .bail()
            .custom((value) => {
                if (value && typeof value.enabled !== 'boolean') {
                    throw new Error('listings.enabled must be a boolean');
                }
                return true;
            }),

        body('requested_operations.reports.inventory_report')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .optional()
            .isObject().withMessage('inventory_report must be an object')
            .bail()
            .custom((value) => {
                if (value && typeof value.enabled !== 'boolean') {
                    throw new Error('inventory_report.enabled must be a boolean');
                }
                return true;
            }),

        // Orders report validation
        body('requested_operations.reports.orders_report')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .optional()
            .isObject().withMessage('orders_report must be an object')
            .bail()
            .custom((value) => {
                if (value && typeof value.enabled !== 'boolean') {
                    throw new Error('orders_report.enabled must be a boolean');
                }
                if (value?.types && typeof value.types !== 'object') {
                    throw new Error('orders_report.types must be an object');
                }
                return true;
            }),

        // Fulfilment report validation
        body('requested_operations.reports.fulfilment_report')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .optional()
            .isObject().withMessage('fulfilment_report must be an object')
            .bail()
            .custom((value) => {
                if (value && typeof value.enabled !== 'boolean') {
                    throw new Error('fulfilment_report.enabled must be a boolean');
                }
                if (value?.types && typeof value.types !== 'object') {
                    throw new Error('fulfilment_report.types must be an object');
                }
                return true;
            }),

        // Payment report validation
        body('requested_operations.reports.payment_report')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .optional()
            .isObject().withMessage('payment_report must be an object')
            .bail()
            .custom((value) => {
                if (value && typeof value.enabled !== 'boolean') {
                    throw new Error('payment_report.enabled must be a boolean');
                }
                if (value?.types && typeof value.types !== 'object') {
                    throw new Error('payment_report.types must be an object');
                }
                return true;
            }),

        // Tax report validation
        body('requested_operations.reports.tax_report')
            .if((value, { req }) => !req.body?.requested_operations?.all?.enabled)
            .optional()
            .isObject().withMessage('tax_report must be an object')
            .bail()
            .custom((value) => {
                if (value && typeof value.enabled !== 'boolean') {
                    throw new Error('tax_report.enabled must be a boolean');
                }
                if (value?.types && typeof value.types !== 'object') {
                    throw new Error('tax_report.types must be an object');
                }
                return true;
            }),

        // At least one report must be enabled or all must be enabled
        body()
            .custom((value) => {
                const allEnabled = value?.requested_operations?.all?.enabled;
                const reports = value?.requested_operations?.reports;
                
                if (allEnabled) {
                    return true; // All reports enabled
                }
                
                if (!reports) {
                    throw new Error('Either enable all reports or specify individual reports');
                }
                
                // Check if at least one report is enabled
                const hasEnabledReport = Object.values(reports).some(report => 
                    report && typeof report === 'object' && report.enabled === true
                );
                
                if (!hasEnabledReport) {
                    throw new Error('At least one report must be enabled');
                }
                
                return true;
            }),
    ];
};

export { singleUserValidation };
