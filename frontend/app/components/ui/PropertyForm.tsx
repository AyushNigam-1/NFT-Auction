"use client"

import React, { useState } from "react";
import InputGroup from "./Input";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { X, Zap } from "lucide-react";
import { useMutations } from "@/app/hooks/useMutations";
import Loader from "./Loader";
import { PropertyFormData } from "@/app/types";

export default function PropertyForm({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: any }) {
    const { createProperty } = useMutations()

    const [formData, setFormData] = useState<PropertyFormData>({
        name: "Sunshine Apartments - Pune",
        symbol: "SUNAPT",
        description: "Modern 2BHK in Hinjewadi with gym and pool",
        image: "", // Note: This should ideally be null | File | string
        address: "Hinjewadi Phase 1, Pune, Maharashtra",
        total_value_inr: "1.2 crore",
        expected_yield: "6.5%",
        documents: [],
        attributes: [
            { trait_type: "Bedrooms", value: "2" },
            { trait_type: "Area", value: "950 sqft" },
        ],
    });

    // 1. FIXED: Cleaned up logic and removed strict 'instanceof' check
    const handleInputChange = (
        field: keyof PropertyFormData,
        value: string | File | null,
        index?: number,
        subField?: "trait_type" | "value"
    ) => {
        // Debugging
        console.log(`Updating ${field}:`, value);

        setFormData((prev) => {
            // Handle Documents Array
            if (field === "documents" && index !== undefined) {
                const newDocs = [...prev.documents];
                // Cast value to any or File to satisfy TS, 
                // simply assign whatever comes from the input (File or null)
                newDocs[index] = value as any;
                return { ...prev, documents: newDocs };
            }

            // Handle Attributes Array
            if (field === "attributes" && index !== undefined && subField) {
                const newAttrs = [...prev.attributes];
                newAttrs[index][subField] = value as string;
                return { ...prev, attributes: newAttrs };
            }

            // Handle Standard Fields (Text or Image File)
            return {
                ...prev,
                [field]: value,
            };
        });
    };

    const addDocument = () => {
        setFormData((prev) => ({
            ...prev,
            documents: [...prev.documents, null as any],
        }));
    };

    const addAttribute = () => {
        setFormData((prev) => ({
            ...prev,
            attributes: [...prev.attributes, { trait_type: "", value: "" }],
        }));
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50 font-mono" onClose={() => setIsOpen(false)}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 scale-90 -translate-y-12"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-90 translate-y-12"
                        >
                            <DialogPanel className="w-full max-w-3xl max-h-[90vh] overflow-y-auto transform rounded-2xl bg-white/5 p-6 transition-all font-inter text-white relative space-y-6 border border-gray-800 shadow-2xl">
                                <DialogTitle as="div" className="flex items-center justify-between">
                                    <h1 className="text-2xl font-bold text-gray-200">
                                        Add Property
                                    </h1>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className=" text-green-400 hover:text-white transition-colors z-10 bg-white/5 rounded-full p-2 hover:bg-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </DialogTitle>
                                <div className='h-0.5 w-full bg-white/10' />
                                <div className="space-y-8">

                                    {/* ... Name, Symbol, Description Inputs (Unchanged) ... */}
                                    <InputGroup
                                        label="Property Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="e.g., Sunshine Apartments - Pune"
                                    />
                                    <InputGroup
                                        label="Symbol"
                                        name="symbol"
                                        value={formData.symbol}
                                        onChange={(e) => handleInputChange("symbol", e.target.value)}
                                        placeholder="e.g., SUNAPT"
                                    />
                                    <InputGroup
                                        label="Description"
                                        name="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        placeholder="Describe your property..."
                                        textarea
                                    />

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <InputGroup
                                            label="Main Image"
                                            name="image"
                                            type="file"
                                            // 2. FIXED: Do not pass 'value' to file input. 
                                            // If you want to show the selected file name, render it in a separate <span> below
                                            onChange={(e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0] || null;
                                                handleInputChange("image", file);
                                            }}
                                            placeholder="Select image..."
                                        />
                                        <InputGroup
                                            label="Full Address"
                                            name="address"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange("address", e.target.value)}
                                            placeholder="Hinjewadi Phase 1, Pune..."
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <InputGroup
                                            label="Total Value (INR)"
                                            name="total_value_inr"
                                            value={formData.total_value_inr}
                                            onChange={(e) => handleInputChange("total_value_inr", e.target.value)}
                                            placeholder="e.g., 1.2 crore"
                                        />
                                        <InputGroup
                                            label="Expected Annual Yield"
                                            name="expected_yield"
                                            value={formData.expected_yield}
                                            onChange={(e) => handleInputChange("expected_yield", e.target.value)}
                                            placeholder="e.g., 6.5%"
                                        />
                                    </div>

                                    {/* Documents */}
                                    <div className='h-0.5 w-full bg-white/10' />
                                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 ">
                                        Legal Documents
                                    </label>

                                    {formData.documents.map((doc, index) => (
                                        <div key={index}>
                                            <InputGroup
                                                label={`Document ${index + 1}`}
                                                name={`doc-${index}`}
                                                type="file"
                                                // 3. FIXED: Removed value={doc}. File inputs must be uncontrolled.
                                                onChange={(e) => {
                                                    const input = e.target as HTMLInputElement;
                                                    const file = input.files?.[0] || null;
                                                    handleInputChange("documents", file, index);
                                                }}
                                                placeholder=""
                                                classNames="mb-2"
                                            />
                                            {/* Optional: Visual confirmation that a file is stored in state */}
                                            {doc && (
                                                <p className="text-xs text-green-400 mb-4">
                                                    Selected: {(doc as any).name}
                                                </p>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addDocument}
                                        className="text-green-400 hover:text-green-500 font-medium"
                                    >
                                        + Add another document
                                    </button>

                                    {/* Attributes */}
                                    <div className='h-0.5 w-full bg-white/10' />
                                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 ">
                                        Property Attributes
                                    </label>

                                    {formData.attributes.map((attr, index) => (
                                        <div key={index} className="grid md:grid-cols-2 gap-4 mb-4">
                                            <InputGroup
                                                label="Trait Type"
                                                name={`trait-${index}`}
                                                value={attr.trait_type}
                                                onChange={(e) =>
                                                    handleInputChange("attributes", e.target.value, index, "trait_type")}
                                                placeholder="e.g., Bedrooms"
                                            />
                                            <InputGroup
                                                label="Value"
                                                name={`value-${index}`}
                                                value={attr.value}
                                                // 4. FIXED: Changed last argument from "trait_type" to "value"
                                                onChange={(e) =>
                                                    handleInputChange("attributes", e.target.value, index, "value")
                                                }
                                                placeholder="e.g., 2"
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addAttribute}
                                        className="text-green-400 hover:text-green-500 font-medium"
                                    >
                                        + Add attribute
                                    </button>

                                    <div className='h-0.5 w-full bg-white/10' />

                                    <button
                                        onClick={() => console.log(formData)}
                                        className=" m-auto flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-lg transition-all bg-green-600 text-white cursor-pointer hover:bg-green-700"
                                    >
                                        {createProperty.isPending ? <Loader /> : <Zap className="size-6" />}
                                        <span>Create</span>
                                    </button>
                                </div>
                            </DialogPanel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}