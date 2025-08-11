import { body } from 'express-validator';
import { SCRAPER_ITEMS } from '../constants.js';

const ALLOWED_REPORT_TYPES = [
    SCRAPER_ITEMS.ITEMS.LISTINGS.KEY,
    SCRAPER_ITEMS.ITEMS.INVENTORY_REPORT.ALL_INVENTORY_REPORT,
    SCRAPER_ITEMS.ITEMS.ORDERS.RETURNS_ORDERS.KEY,
    SCRAPER_ITEMS.ITEMS.ORDERS.CANCELLED_ORDERS.KEY,
    SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.PROCESSING_ORDERS,
    SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.DISPATCHED_ORDERS,
    SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.COMPLETED_ORDERS,
    SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.UPCOMING_ORDERS,
    SCRAPER_ITEMS.ITEMS.FULFILMENT_REPORT.FULFILMENT_RETURN_REPORT,
    SCRAPER_ITEMS.ITEMS.INVOICE_REPORT.KEY,
    SCRAPER_ITEMS.ITEMS.PAYMENT_REPORT.FINANCIAL_REPORT,
    SCRAPER_ITEMS.ITEMS.PAYMENT_REPORT.SETTLED_TRANSACTIONS_REPORT,
    SCRAPER_ITEMS.ITEMS.TAX_REPORT.GST_REPORT,
    SCRAPER_ITEMS.ITEMS.TAX_REPORT.SALES_REPORT,
    SCRAPER_ITEMS.ITEMS.TAX_REPORT.TDS_REPORT,
];

const bulkUserValidation = [
    body()
        .isArray({ min: 1 }).withMessage('Body must be a non-empty array of user requests'),

    body('*.seller_id')
        .exists({ checkNull: true }).withMessage('seller_id is required')
        .bail()
        .isString().withMessage('seller_id must be a string')
        .bail()
        .notEmpty().withMessage('seller_id cannot be empty'),

    body('*.identifier')
        .exists({ checkNull: true }).withMessage('identifier is required')
        .bail()
        .isString().withMessage('identifier must be a string')
        .bail()
        .notEmpty().withMessage('identifier cannot be empty'),

    body('*.otp_login')
        .optional()
        .isBoolean().withMessage('otp_login must be a boolean')
        .toBoolean(),

    body('*.password')
        .if((value, { req, path }) => {
            // express-validator applies per element, access corresponding element
            const indexMatch = path.match(/^(\d+)/);
            const index = indexMatch ? Number(indexMatch[1]) : null;
            const element = Array.isArray(req.body) && index !== null ? req.body[index] : {};
            return element.otp_login === false || element.otp_login === undefined;
        })
        .exists({ checkNull: true }).withMessage('password is required when otp_login is false')
        .bail()
        .isString().withMessage('password must be a string')
        .bail()
        .notEmpty().withMessage('password cannot be empty'),

    body('*.reportType')
        .exists({ checkNull: true })
        .withMessage('reportType is required')
        .isString()
        .withMessage('reportType must be a string')
        .isIn(ALLOWED_REPORT_TYPES).withMessage('reportType is not supported'),

    body('*.parameters')
        .exists({ checkNull: true })
        .withMessage('parameters is required')
        .isObject()
        .withMessage('parameters must be an object'),

    body('*.parameters.startDate')
        .exists({ checkNull: true })
        .withMessage('parameters.startDate is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('parameters.startDate must be in yyyy-mm-dd format'),

    body('*.parameters.endDate')
        .exists({ checkNull: true })
        .withMessage('parameters.endDate is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('parameters.endDate must be in yyyy-mm-dd format')
        .custom((end, { req, path }) => {
            const indexMatch = path.match(/^(\d+)/);
            const index = indexMatch ? Number(indexMatch[1]) : null;
            const element = Array.isArray(req.body) && index !== null ? req.body[index] : {};
            const start = element?.parameters?.startDate;
            if (start && end && new Date(end) < new Date(start)) {
                throw new Error('parameters.endDate must be greater than or equal to startDate');
            }
            return true;
        }),
];

export { bulkUserValidation };
