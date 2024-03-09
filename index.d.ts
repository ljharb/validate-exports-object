declare namespace validateExportsObject {
    type StatusString = 'empty' | 'files' | 'conditions';
    type ExportsFiles = {
        [fileURL: `./${string}`]: Exports;
    };
    type ExportsConditions = {
        [condition in string]: condition extends `./${string}` ? never : Exports;
    };
    type ExportsArray = Array<Exports>;
    type Exports = null | string | ExportsConditions | ExportsFiles | Exports[];
}

declare function validateExportsObject<T = unknown>(
    obj: T,
    parentKey?: string,
): {
    __proto__: null;
    normalized: undefined | validateExportsObject.Exports;
    problems: string[];
    status: false | validateExportsObject.StatusString;
};

export = validateExportsObject;