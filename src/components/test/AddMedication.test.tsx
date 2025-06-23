import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddMedication from "../Medications/AddMedication";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../supabaseClient", () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }),
      },
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        })),
        update: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("AddMedication Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form inputs", () => {
    renderWithProviders(<AddMedication />);
    expect(screen.getByPlaceholderText("Medication Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Dosage")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Add Medications")).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    renderWithProviders(<AddMedication />);
    fireEvent.click(screen.getByText("Add Medication"));

    expect(await screen.findByText("Medication name is required")).toBeInTheDocument();
    expect(await screen.findByText("Dosage is required")).toBeInTheDocument();
    expect(await screen.findByText("Frequency is required")).toBeInTheDocument();
  });

  it("submits valid form and resets inputs", async () => {
    renderWithProviders(<AddMedication />);

    fireEvent.change(screen.getByPlaceholderText("Medication Name"), {
      target: { value: "Paracetamol" },
    });
    fireEvent.change(screen.getByPlaceholderText("Dosage"), {
      target: { value: "500mg" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Once a day" },
    });

    fireEvent.click(screen.getByText("Add Medication"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Medication Name")).toHaveValue("");
      expect(screen.getByPlaceholderText("Dosage")).toHaveValue("");
      expect(screen.getByRole("combobox")).toHaveValue("");
    });
  });
});
