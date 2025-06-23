import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import EditMedicationModal from "./EditMedicationModal";


export default function AddMedication() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
  });
  const [errors, setErrors] = useState({ name: "", dosage: "", frequency: "" });
  const [editing, setEditing] = useState<any>(null);
  const [photo_url,setPhoto_url] = useState("")

  const handleOnAddData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

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
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "cloudinary"); 

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dhqj6xkl2/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    if (!res.ok) throw new Error("Failed to upload image");

    const result = await res.json();
    setPhoto_url(result.secure_url)
  };
console.log(photo_url,"photo_url");

  const mutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

     console.log(photo_url,"photo_urlphoto_url");
     
      

      const { error } = await supabase.from("medications").insert({
        user_id: user.id,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        taken_today: false,
        photo_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      setFormData({ name: "", dosage: "", frequency: "" });
      setPhoto_url("")
      setFile(null);
      setErrors({ name: "", dosage: "", frequency: "" });
    },
  });

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user?.id);
      return data;
    },
  });

  const markTaken = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("medications")
        .update({ taken_today: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["medications"] }),
  });

  const deleteMed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["medications"] }),
  });

  const handleSubmit = () => {
    if (validateForm()) {
      mutation.mutate();
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Medications</h2>

        <input
          type="text"
          placeholder="Medication Name"
          value={formData.name}
          onChange={(e) => handleOnAddData("name", e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mb-2">{errors.name}</p>
        )}

        <input
          type="text"
          placeholder="Dosage"
          value={formData.dosage}
          onChange={(e) => handleOnAddData("dosage", e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />
        {errors.dosage && (
          <p className="text-red-500 text-sm mb-2">{errors.dosage}</p>
        )}

        <select
          value={formData.frequency}
          onChange={(e) => handleOnAddData("frequency", e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        >
          <option value="">Select Frequency</option>
          <option value="Once a day">Once a day</option>
          <option value="Twice a day">Twice a day</option>
          <option value="Weekly">Weekly</option>
        </select>
        {errors.frequency && (
          <p className="text-red-500 text-sm mb-2">{errors.frequency}</p>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
              uploadToCloudinary(selectedFile);
            }
          }}
          className="mb-3"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition"
        >
          {mutation.isPending ? "Adding..." : "Add Medication"}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Your Medications</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Dosage</th>
                <th className="border px-4 py-2">Frequency</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Photo</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications?.map((med: any) => (
                <tr key={med.id}>
                  <td className="border px-4 py-2">{med.name}</td>
                  <td className="border px-4 py-2">{med.dosage}</td>
                  <td className="border px-4 py-2">{med.frequency}</td>
                  <td className="border px-4 py-2">
                    {med.taken_today ? "Taken" : "Not Taken"}
                  </td>
                  <td className="border px-4 py-2">
                    {med.photo_url && (
                      <img
                        src={med.photo_url}
                        alt="medication"
                        className="w-12 h-12 rounded"
                      />
                    )}
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    {!med.taken_today && (
                      <button
                        type="button"
                        onClick={() => markTaken.mutate(med.id)}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                      >
                        Mark Taken
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(med)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMed.mutate(med.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <EditMedicationModal
          open={!!editing}
          medication={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
