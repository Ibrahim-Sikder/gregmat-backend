import 'reflect-metadata';
import type { Model } from 'mongoose';

export interface IQueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    fields?: string;
    search?: string;
    [key: string]: any;
}

export interface IPaginatedResult<T> {
    data: T[];
    meta: {
        limit: number;
        page: number;
        total: number;
        totalPage: number;
    };
}

const PAGINATION_KEY = Symbol('pagination');
const SEARCH_KEY = Symbol('search');
const SORT_KEY = Symbol('sort');
const POPULATE_KEY = Symbol('populate');
const SELECT_FIELDS_KEY = Symbol('selectFields');

/**
 * @Pagination(defaultLimit = 20, maxLimit = 100)
 */
export function Pagination(defaultLimit = 20, maxLimit = 100) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(
            PAGINATION_KEY,
            { defaultLimit, maxLimit },
            target.constructor,
            propertyKey
        );
        return descriptor;
    };
}

/**
 * @Search(['field1','field2'])
 */
export function Search(fields: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(SEARCH_KEY, fields, target.constructor, propertyKey);
        return descriptor;
    };
}

/**
 * @Sort('-createdAt')
 */
export function Sort(defaultSort = 'createdAt') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(SORT_KEY, defaultSort, target.constructor, propertyKey);
        return descriptor;
    };
}

/**
 * @SelectFields(['title','body']) or @SelectFields() to allow ?fields=
 */
export function SelectFields(defaultFields?: string[] | true) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(
            SELECT_FIELDS_KEY,
            defaultFields ?? true,
            target.constructor,
            propertyKey
        );
        return descriptor;
    };
}

/**
 * @Populate(['author', 'comments'])
 */
export function Populate(fields: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(POPULATE_KEY, fields, target.constructor, propertyKey);
        return descriptor;
    };
}

/**
 * @Query() - Must be the last decorator (closest to the method)
 */
export function Query() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, query: IQueryParams = {}, ...args: any[]) {
            const model: Model<any> = this.model;
            if (!model) {
                throw new Error(
                    `Model not found in ${target.constructor.name}. Ensure your service has a "model" property.`
                );
            }

            // destructure search explicitly so it doesn't become a literal filter
            const { page, limit, sort, fields, search, ...filters } = query;

            // metadata
            const paginationMeta = Reflect.getMetadata(
                PAGINATION_KEY,
                target.constructor,
                propertyKey
            ) as { defaultLimit: number; maxLimit: number } | undefined;
            const searchFields = Reflect.getMetadata(
                SEARCH_KEY,
                target.constructor,
                propertyKey
            ) as string[] | undefined;
            const sortMeta = Reflect.getMetadata(SORT_KEY, target.constructor, propertyKey) as
                | string
                | undefined;
            const populateFields = Reflect.getMetadata(
                POPULATE_KEY,
                target.constructor,
                propertyKey
            ) as string[] | undefined;
            const selectFieldsEnabled = Reflect.getMetadata(
                SELECT_FIELDS_KEY,
                target.constructor,
                propertyKey
            ) as boolean | string[] | undefined;

            // Build filter object (apply search here)
            const filterObject: Record<string, any> = { ...filters };

            if (searchFields && search) {
                try {
                    // Escape special regex characters to allow searching for any text
                    const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const searchRegex = new RegExp(escapedSearch, 'i');

                    const searchConditions = searchFields.map((f) => ({
                        [f]: { $regex: searchRegex },
                    }));

                    // if there are already top-level $or, merge carefully
                    if (filterObject.$or) {
                        filterObject.$and = filterObject.$and || [];
                        filterObject.$and.push(
                            { $or: filterObject.$or },
                            { $or: searchConditions }
                        );
                        delete filterObject.$or;
                    } else {
                        filterObject.$or = searchConditions;
                    }
                } catch (error) {
                    // If regex construction fails, silently fall back to simple text matching
                    // This allows the query to continue without search filters
                }
            }

            // Start building mongoose query from final filterObject
            let mongoQuery = model.find(filterObject);

            // SELECT fields: default fields or query.fields
            if (selectFieldsEnabled) {
                if (Array.isArray(selectFieldsEnabled) && selectFieldsEnabled.length > 0) {
                    mongoQuery = mongoQuery.select((selectFieldsEnabled as string[]).join(' '));
                }
                // if selectFieldsEnabled is true, allow query.fields to override
                if (query.fields) {
                    const fieldStr = String(query.fields).split(',').join(' ');
                    mongoQuery = mongoQuery.select(fieldStr);
                }
            } else {
                // If selectFields not enabled but user requested fields, honor it
                if (query.fields) {
                    const fieldStr = String(query.fields).split(',').join(' ');
                    mongoQuery = mongoQuery.select(fieldStr);
                }
            }

            // Sorting
            if (sortMeta) {
                const sortBy = query.sort ? String(query.sort).split(',').join(' ') : sortMeta;
                mongoQuery = mongoQuery.sort(sortBy);
            } else if (query.sort) {
                mongoQuery = mongoQuery.sort(String(query.sort).split(',').join(' '));
            }

            // Populate
            if (populateFields) {
                populateFields.forEach((p: string) => {
                    mongoQuery = mongoQuery.populate(p);
                });
            }

            // Pagination: must use filterObject for count
            if (paginationMeta) {
                const pageNum = Math.max(1, Number(query.page) || 1);
                const lim = Math.min(
                    paginationMeta.maxLimit,
                    Math.max(1, Number(query.limit) || paginationMeta.defaultLimit)
                );
                const skip = (pageNum - 1) * lim;

                const pagedQuery = mongoQuery.skip(skip).limit(lim);

                const total = await model.countDocuments(filterObject);
                const data = await pagedQuery;
                const totalPages = Math.ceil(total / lim);

                const result: IPaginatedResult<any> = {
                    data,
                    meta: {
                        page: pageNum,
                        limit: lim,
                        total,
                        totalPage: totalPages,
                    },
                };

                // If original method expects (query, data, ...), call it to allow further processing
                if (typeof originalMethod === 'function' && originalMethod.length > 1) {
                    return await originalMethod.call(this, query, result, ...args);
                }

                return result;
            }

            // No pagination: execute and optionally call original method
            const data = await mongoQuery;

            if (typeof originalMethod === 'function' && originalMethod.length > 1) {
                return await originalMethod.call(this, query, data, ...args);
            }

            return data;
        };

        return descriptor;
    };
}
