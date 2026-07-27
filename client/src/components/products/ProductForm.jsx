import { useEffect, useState } from "react";

const categories = [
    "Vegetables",
    "Fruits",
    "Grains",
    "Dairy",
    "Meat",
    "Seafood",
    "Beverages",
    "Spices",
    "Others",
];

const units = [
    "kg",
    "g",
    "L",
    "mL",
    "Piece",
    "Pack",
    "Box",
    "Dozen",
];

const ProductForm = ({
    initialData = null,
    onSubmit,
    onCancel,
}) => {

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "",
        price: "",
        stock: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                category: initialData.category || "",
                unit: initialData.unit || "",
                price: initialData.price || "",
                stock: initialData.stock || "",
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (
            !formData.name ||
            !formData.category ||
            !formData.unit ||
            formData.price === "" ||
            formData.stock === ""
        ) {
            alert("Please fill all fields.");
            return;
        }

        if (Number(formData.price) <= 0) {
            alert("Price must be greater than 0.");
            return;
        }

        if (Number(formData.stock) < 0) {
            alert("Stock cannot be negative.");
            return;
        }

        onSubmit({
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock),
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >

            {/* Product Name */}

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Product Name
                </label>

                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
            </div>

            {/* Category */}

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                </label>

                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="">Select Category</option>

                    {categories.map((category) => (
                        <option
                            key={category}
                            value={category}
                        >
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            {/* Unit */}

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Unit
                </label>

                <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                    <option value="">Select Unit</option>

                    {units.map((unit) => (
                        <option
                            key={unit}
                            value={unit}
                        >
                            {unit}
                        </option>
                    ))}
                </select>
            </div>

            {/* Price & Stock */}

            <div className="grid grid-cols-2 gap-4">

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Price (₹)
                    </label>

                    <input
                        type="number"
                        min="1"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Stock
                    </label>

                    <input
                        type="number"
                        min="0"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

            </div>

            {/* Buttons */}

            <div className="flex justify-end gap-4 pt-2">

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
                >
                    {initialData ? "Update Product" : "Save Product"}
                </button>

            </div>

        </form>
    );
};

export default ProductForm;