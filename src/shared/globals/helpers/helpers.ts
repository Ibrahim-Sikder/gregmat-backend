import mongoose from 'mongoose';

export class Helpers {
    static firstLetterUppercase(str: string): string {
        const valueString = str.toLowerCase();
        return valueString
            .split(' ')
            .map(
                (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`
            )
            .join(' ');
    }

    static lowerCase(str: string): string {
        return str.toLowerCase();
    }

    static generateRandomIntegers(integerLength: number): number {
        const characters = '0123456789';
        let result = ' ';
        const charactersLength = characters.length;
        for (let i = 0; i < integerLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return parseInt(result, 10);
    }

    static parseJson(prop: string): any {
        try {
            JSON.parse(prop);
        } catch (_error) {
            return prop;
        }
        return JSON.parse(prop);
    }

    static shuffle(list: string[]): string[] {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        return list;
    }

    static escapeRegex(text: string): string {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    static convertToRedisValue(val: any): string {
        if (Array.isArray(val) || typeof val === 'object') return JSON.stringify(val);
        return String(val ?? ''); // fallback if null/undefined
    }

    static convertFromRedisValue(val: any): any {
        try {
            return JSON.parse(val);
        } catch {
            return val;
        }
    }

    static slugify(text: string): string {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    static isValidObjectId(id: string): boolean {
        const ObjectId = mongoose.Types.ObjectId;
        return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
    }
}
