import { useEffect, useState } from "react";
import { CheckCircle2, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_INSURANCES } from "@/data/mockCenters";

type Step = "form" | "confirm" | "success";

const emptyForm = {
  patientName: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  insurance: "" as string,
  policyId: "",
  healthcareNotes: "",
};

export type ReferralDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerName: string;
  centerId: string;
  /** Fires once when the user completes the final submit and lands on the success step. */
  onReferred?: (centerId: string) => void;
};

export function ReferralDialog({ open, onOpenChange, centerName, centerId, onReferred }: ReferralDialogProps) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setForm({ ...emptyForm });
      setFormError(null);
    }
  }, [open, centerName, centerId]);

  const canContinue = () => {
    if (!form.patientName.trim()) return { ok: false, message: "Please enter the patient’s full name." };
    if (!form.dateOfBirth) return { ok: false, message: "Please enter a date of birth." };
    if (!form.phone.trim()) return { ok: false, message: "Please enter a phone number." };
    if (!form.insurance) return { ok: false, message: "Please select an insurance plan." };
    if (!form.healthcareNotes.trim()) return { ok: false, message: "Please add relevant healthcare information for this referral." };
    return { ok: true, message: null as string | null };
  };

  const handleContinue = () => {
    const v = canContinue();
    if (!v.ok) {
      setFormError(v.message!);
      return;
    }
    setFormError(null);
    setStep("confirm");
  };

  const handleFinalSubmit = () => {
    if (centerId) onReferred?.(centerId);
    setStep("success");
  };

  const closeAndReset = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display pr-6">Refer a patient</DialogTitle>
              <DialogDescription>
                To <span className="font-medium text-foreground">{centerName || "this center"}</span>, send
                key details so the imaging team can follow up. Nothing is sent to a real system in this
                preview.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-1">
              <div className="space-y-2">
                <Label htmlFor="ref-patient-name">Patient full name *</Label>
                <Input
                  id="ref-patient-name"
                  autoComplete="name"
                  value={form.patientName}
                  onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                  placeholder="Legal name as on ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref-dob">Date of birth *</Label>
                <Input
                  id="ref-dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ref-phone">Phone *</Label>
                  <Input
                    id="ref-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref-email">Email</Label>
                  <Input
                    id="ref-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="optional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref-insurance">Insurance *</Label>
                <Select
                  value={form.insurance || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, insurance: v }))}
                >
                  <SelectTrigger id="ref-insurance">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_INSURANCES.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref-policy">Member / policy ID</Label>
                <Input
                  id="ref-policy"
                  value={form.policyId}
                  onChange={(e) => setForm((f) => ({ ...f, policyId: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref-notes">Healthcare information *</Label>
                <Textarea
                  id="ref-notes"
                  value={form.healthcareNotes}
                  onChange={(e) => setForm((f) => ({ ...f, healthcareNotes: e.target.value }))}
                  placeholder="Reason for imaging, prior studies, relevant history, allergies, and any urgent clinical context."
                  className="min-h-[100px] resize-y"
                />
              </div>
              {formError && <p className="text-sm text-amber-800 dark:text-amber-200">{formError}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closeAndReset}>
                Cancel
              </Button>
              <Button type="button" variant="hero" className="gap-2" onClick={handleContinue}>
                <Shield className="h-3.5 w-3.5" />
                Review &amp; confirm
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display pr-6">Confirm referral</DialogTitle>
              <DialogDescription>
                You are about to send this referral to <span className="text-foreground font-medium">{centerName}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 rounded-lg border border-border/80 bg-secondary/30 px-3 py-3 text-sm">
              <p>
                <span className="text-muted-foreground">Patient: </span>
                <span className="font-medium text-foreground">{form.patientName}</span>
              </p>
              <p>
                <span className="text-muted-foreground">DOB: </span>
                {form.dateOfBirth}
              </p>
              <p>
                <span className="text-muted-foreground">Contact: </span>
                {form.phone}
                {form.email ? ` · ${form.email}` : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Insurance: </span>
                {form.insurance}
                {form.policyId ? ` · ${form.policyId}` : ""}
              </p>
              <p className="whitespace-pre-wrap text-foreground/90">
                <span className="text-muted-foreground">Clinical / healthcare notes: </span>
                {form.healthcareNotes}
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button type="button" variant="hero" className="gap-2" onClick={handleFinalSubmit}>
                <Shield className="h-3.5 w-3.5" />
                Submit referral
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center text-center sm:pt-1">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="font-display">Referral received</DialogTitle>
              <DialogDescription className="text-base text-foreground/90">
                Your referral to <span className="font-medium text-foreground">{centerName}</span> is on
                file. The imaging center can use these details to verify insurance and follow up with the
                patient. You can close this window.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 w-full">
              <Button type="button" variant="hero" className="w-full" onClick={closeAndReset}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
