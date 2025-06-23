import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EditMedicationModalProps {
  open: boolean;
  medication: any;
  onClose: () => void;
}

export default function EditMedicationModal({ open, medication, onClose }: EditMedicationModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    photo_url: medication.photo_url || "",
  });

  const [errors, setErrors] = useState({ name: "", dosage: "", frequency: "" });
  const [uploading, setUploading] = useState(false);

  const validateForm = () => {
    const newErrors = { name: "", dosage: "", frequency: "" };
    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Medication name is required";
      valid = false;
    }
    if (!formData.dosage.trim()) {
      newErrors.dosage = "Dosage is required";
      valid = false;
    }
    if (!formData.frequency.trim()) {
      newErrors.frequency = "Frequency is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "cloudinary");

    const res = await fetch("https://api.cloudinary.com/v1_1/dhqj6xkl2/image/upload", {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      setUploading(false);
      throw new Error("Image upload failed");
    }

    const result = await res.json();
    setFormData((prev) => ({ ...prev, photo_url: result.secure_url }));
    setUploading(false);
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("medications")
        .update({
          name: formData.name,
          dosage: formData.dosage,
          frequency: formData.frequency,
          photo_url: formData.photo_url,
        })
        .eq("id", medication.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Medication</h3>

        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Medication Name"
          className="w-full mb-2 px-3 py-2 border rounded"
        />
        {errors.name && <p className="text-red-500 text-sm mb-2">{errors.name}</p>}

        <input
          type="text"
          value={formData.dosage}
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          placeholder="Dosage"
          className="w-full mb-2 px-3 py-2 border rounded"
        />
        {errors.dosage && <p className="text-red-500 text-sm mb-2">{errors.dosage}</p>}

        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded"
        >
          <option value="">Select Frequency</option>
          <option value="Once a day">Once a day</option>
          <option value="Twice a day">Twice a day</option>
          <option value="Weekly">Weekly</option>
        </select>
        {errors.frequency && <p className="text-red-500 text-sm mb-2">{errors.frequency}</p>}

        <div className="mb-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadToCloudinary(file);
            }}
            className="w-full"
          />
          {formData.photo_url && (
            <img src={formData.photo_url} alt="Medication" className="w-16 h-16 mt-2 rounded" />
          )}
          {uploading && <p className="text-blue-500 text-sm mt-1">Uploading image...</p>}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => validateForm() && updateMutation.mutate()}
            disabled={updateMutation.isPending || uploading}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
