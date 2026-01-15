import { ChangeEvent } from "react";

export interface SelectOption {
    label: string;
    value: string | number;
}

const InputGroup: React.FC<{
    label: string;
    name: string;
    value?: string | number | File | undefined;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    textarea?: boolean;
    select?: boolean;           // NEW: trigger for select input
    options?: SelectOption[];
    classNames?: string
}> = ({ label, name, value, onChange, placeholder, type = 'text', disabled, textarea, select,
    options, classNames }) => (
        <div className={` ${classNames} w-full `}>
            <label htmlFor={name} className="block font-bold text-gray-300 mb-2 ">
                {label}
            </label>
            {
                textarea ? (
                    <textarea
                        id={name}
                        name={name}
                        value={value as string}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={4}
                        className="w-full px-4 py-3 border-none rounded-lg dark:bg-white/5 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition"
                    />
                ) : select ? (
                    // NEW: Select logic here
                    <select
                        id={name}
                        name={name}
                        value={value as string | number}
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full px-4 py-3 border-none rounded-lg dark:bg-white/5 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition appearance-none"
                    >
                        {/* Default placeholder option */}
                        {placeholder && <option value="" disabled>{placeholder}</option>}

                        {/* Map through options */}
                        {options?.map((opt) => (
                            <option key={opt.value} value={opt.value} className="text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-200">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : type === "file" ? (
                    // FIX: Added attributes here. Note: We DO NOT pass 'value' to file inputs
                    <input
                        id={name}
                        name={name}
                        type="file"
                        onChange={onChange}
                        disabled={disabled}
                        className="w-full px-4 py-3 border-none rounded-lg dark:bg-white/5 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition"
                    />
                ) : (
                    <input
                        id={name}
                        name={name}
                        type={type}
                        step={type === 'number' ? 'any' : undefined}
                        value={value as string | number}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full px-4 py-3 border-none rounded-lg dark:bg-white/5 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition"
                    />
                )
            }
        </div>
    );

export default InputGroup;