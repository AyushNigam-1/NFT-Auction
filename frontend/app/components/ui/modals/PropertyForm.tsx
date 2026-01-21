"use client"

import React, { useState } from "react";
import InputGroup from "../Input";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { Delete, Recycle, Trash, X, Zap } from "lucide-react";
import { useMutations } from "@/app/hooks/useMutations";
import Loader from "../layout/Loader";
import { PropertyFormData } from "@/app/types";

export default function PropertyForm({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: any }) {
    const { createProperty } = useMutations()

    const [formData, setFormData] = useState<PropertyFormData>({
        name: "Sunshine Apartments - Pune",
        symbol: "SUNAPT",
        description: "Discover the charm of Sunset Haven Villa, a beautifully designed 4-bedroom, 3-bathroom home nestled in the serene Greenfield Heights community. Featuring an open-concept living space, a modern modular kitchen, and large panoramic windows that flood the rooms with natural light, this property offers the perfect blend of comfort and elegance. The landscaped backyard with a private patio is ideal for evening gatherings, while the spacious garage and smart home features add convenience to your lifestyle.",
        images: [],
        address: "Willow Creek Lane, Greenfield Heights, Riverview City, 560045",
        total_value: 100000,
        expected_yield: 5,
        type: "",
        total_share: 100,
        rent: 10000,
        legal_documents: [],
        attributes: [],
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
            // Handle legal_documents Array
            if (field === "legal_documents" && index !== undefined) {
                const newDocs = [...prev.legal_documents];
                // Cast value to any or File to satisfy TS, 
                // simply assign whatever comes from the input (File or null)
                newDocs[index] = value as any;
                return { ...prev, legal_documents: newDocs };
            }
            if (field === "images" && index !== undefined) {
                const newDocs = [...prev.images];
                // Cast value to any or File to satisfy TS, 
                // simply assign whatever comes from the input (File or null)
                newDocs[index] = value as any;
                return { ...prev, images: newDocs };
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
                                    <h1 className="text-2xl font-bold text-gray-100">
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
                                        label="Full Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                        placeholder="Hinjewadi Phase 1, Pune..."
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
                                            label="Property Type"
                                            name="symbol"
                                            value={formData.type}
                                            select={true}
                                            options={[{ label: 'Rented', value: "Rented" }, { label: 'Vacant', value: "Vacant" }, { label: 'Self-Occupied', value: "Self Occupied" }, { label: 'Under Renovation', value: "Under Renovation" }]}
                                            onChange={(e) => handleInputChange("type", e.target.value)}
                                        // placeholder="e.g., SUNAPT"
                                        />
                                        {/* <InputGroup
                                            label="Property Status"
                                            name="symbol"
                                            select={true}
                                            options={[{ label: 'Residential', value: "Residential" }, { label: 'Commercial', value: "Commercial" }]}
                                            value={formData.status}
                                            onChange={(e) => handleInputChange("status", e.target.value)}
                                        // placeholder="e.g., SUNAPT"
                                        /> */}
                                        <InputGroup
                                            label="Expected Annual Yield"
                                            name="expected_yield"
                                            value={formData.expected_yield}
                                            onChange={(e) => handleInputChange("expected_yield", e.target.value)}
                                            placeholder="e.g., 6.5%"
                                        />

                                        <InputGroup
                                            label="Symbol"
                                            name="symbol"
                                            value={formData.symbol}
                                            onChange={(e) => handleInputChange("symbol", e.target.value)}
                                            placeholder="e.g., SUNAPT"
                                        />
                                        {/* </div> */}
                                        {/* <div className="grid md:grid-cols-2 gap-6"> */}
                                        <InputGroup
                                            label="Total Value (USD)"
                                            name="total_value_inr"
                                            value={formData.total_value}
                                            onChange={(e) => handleInputChange("total_value", e.target.value)}
                                            placeholder="e.g., 1.2 crore"
                                        />

                                        <InputGroup
                                            label="Rent Monthly (USD)"
                                            name="symbol"
                                            value={formData.rent}
                                            onChange={(e) => handleInputChange("rent", e.target.value)}
                                            placeholder="1000000"
                                        />

                                        <InputGroup
                                            label="Total Shares"
                                            name="total_share"
                                            value={formData.total_share}
                                            onChange={(e) => handleInputChange("total_share", e.target.value)}
                                            placeholder="e.g., 1.2 crore"
                                        />
                                    </div>
                                    {/* <div className='h-0.5 w-full bg-white/10' /> */}

                                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-100 ">
                                        Property Images
                                    </label>
                                    {/* Image Grid Container */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">

                                        {/* 1. Map through existing images (Previews) */}
                                        {formData.images.map((img, index) => (
                                            img ? (
                                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
                                                    {/* Image Preview */}
                                                    <img
                                                        src={URL.createObjectURL(img as unknown as Blob)}
                                                        alt={`Preview ${index}`}
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Overlay with Delete Button */}
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newImages = [...formData.images];
                                                                newImages.splice(index, 1);
                                                                setFormData(prev => ({ ...prev, images: newImages }));
                                                            }}
                                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                                                        >
                                                            <Trash className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null
                                        ))}

                                        {/* 2. The "Add New" Placeholder Card */}
                                        <div className="relative aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-green-400 hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-green-400">

                                            {/* Invisible File Input covering the card */}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            images: [...prev.images, file] // Append new file
                                                        }));
                                                    }
                                                    // Reset input value to allow selecting same file again if needed
                                                    e.target.value = '';
                                                }}
                                            />

                                            {/* Visual Icon */}
                                            <span className="text-3xl font-light">+</span>
                                        </div>

                                    </div>
                                    {/* legal_documents */}
                                    {/* <div className='h-0.5 w-full bg-white/10' /> */}
                                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-100 ">
                                        Legal documents
                                    </label>

                                    {/* Document Grid Container */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                        {/* 1. Map through existing legal_documents */}
                                        {formData.legal_documents.map((doc, index) => (
                                            doc ? (
                                                <div key={index} className="relative aspect-square rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-4 group space-y-2 ">

                                                    {/* Visual Icon for Document */}
                                                    {/* <div className="p"> */}
                                                    {/* You can replace this SVG with a specific FileText icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {/* </div> */}

                                                    {/* Filename (Truncated) */}
                                                    <p className="text-xs text-gray-300 text-center w-full truncate px-2 font-medium">
                                                        {(doc as File).name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500  uppercase">
                                                        {(doc as File).name.split('.').pop()} File
                                                    </p>

                                                    {/* Overlay with Delete Button */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newDocs = [...formData.legal_documents];
                                                                newDocs.splice(index, 1);
                                                                setFormData(prev => ({ ...prev, legal_documents: newDocs }));
                                                            }}
                                                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg transform hover:scale-110"
                                                        >
                                                            <Trash className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null
                                        ))}

                                        {/* 2. The "Add Document" Placeholder Card */}
                                        <div className="relative aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-blue-400 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-green-300 group">

                                            {/* Invisible File Input */}
                                            <input
                                                type="file"
                                                // Accept PDFs and standard Docs
                                                accept=".pdf,.doc,.docx,.txt"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            legal_documents: [...prev.legal_documents, file]
                                                        }));
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />

                                            {/* Visual Cue */}
                                            <span className="text-3xl font-light group-hover:-translate-y-1 transition-transform duration-300">+</span>
                                            {/* <span className="text-xs font-semibold">Upload Doc</span> */}
                                        </div>

                                    </div>

                                    {/* Attributes */}
                                    {/* <div className='h-0.5 w-full bg-white/10' /> */}
                                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-100 ">
                                        Property Attributes
                                    </label>

                                    {formData.attributes.map((attr, index) => (
                                        <div key={index} className="grid md:grid-cols-2 gap-4 ">
                                            <InputGroup
                                                label="Type"
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
                                        onClick={() => setFormData((prev) => ({
                                            ...prev,
                                            attributes: [...prev.attributes, { trait_type: "", value: "" }],
                                        }))}
                                        className="text-green-300 hover:text-green-400 font-medium"
                                    >
                                        + Add attribute
                                    </button>

                                    <div className='h-0.5 w-full bg-white/10' />

                                    <button
                                        onClick={() => createProperty.mutateAsync({ metadata: formData })}
                                        disabled={createProperty.isPending}
                                        className="m-auto flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-lg transition-all bg-green-800 text-white cursor-pointer hover:bg-green-700"
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
        </Transition >
    );
}