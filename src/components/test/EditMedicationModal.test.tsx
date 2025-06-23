import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditMedicationModal from "../Medications/EditMedicationModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const updateMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("../../supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => updateMock()),
      })),
    })),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("EditMedicationModal", () => {
  const mockMedication = {
    id: "med-1",
    name: "Paracetamol",
    dosage: "500mg",
    frequency: "Once a day",
    photo_url: "",
  };

  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with pre-filled medication data", () => {
    renderWithProviders(
      <EditMedicationModal open={true} medication={mockMedication} onClose={onCloseMock} />
    );

    expect(screen.getByPlaceholderText("Medication Name")).toHaveValue("Paracetamol");
    expect(screen.getByPlaceholderText("Dosage")).toHaveValue("500mg");
    expect(screen.getByDisplayValue("Once a day")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("shows validation errors on empty fields", async () => {
    renderWithProviders(
      <EditMedicationModal open={true} medication={mockMedication} onClose={onCloseMock} />
    );

    fireEvent.change(screen.getByPlaceholderText("Medication Name"), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText("Dosage"), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });

    fireEvent.click(screen.getByText("Update"));

    expect(await screen.findByText("Medication name is required")).toBeInTheDocument();
    expect(await screen.findByText("Dosage is required")).toBeInTheDocument();
    expect(await screen.findByText("Frequency is required")).toBeInTheDocument();
  });

  it("submits valid form and closes modal", async () => {
    renderWithProviders(
      <EditMedicationModal open={true} medication={mockMedication} onClose={onCloseMock} />
    );

    fireEvent.change(screen.getByPlaceholderText("Medication Name"), { target: { value: "Ibuprofen" } });
    fireEvent.change(screen.getByPlaceholderText("Dosage"), { target: { value: "200mg" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Twice a day" } });

    fireEvent.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
