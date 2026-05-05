import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserAgreementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    processing?: boolean;
}

export default function UserAgreementModal({
    open,
    onOpenChange,
    onConfirm,
    processing = false,
}: UserAgreementModalProps) {
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        if (!open) {
            setIsChecked(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        User Agreement
                    </DialogTitle>
                    <DialogDescription>
                        Please review and accept the agreement before submitting
                        your loan application.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 text-sm leading-6 text-slate-700">
                        <p>
                            By submitting this loan application, I confirm that
                            all information I provided is true, complete, and
                            accurate to the best of my knowledge.
                        </p>
                        <p>
                            I understand that my application will be subject to
                            review and approval based on the cooperative&apos;s
                            lending policies, eligibility requirements, and
                            available records.
                        </p>
                        <p>
                            I agree to comply with the approved loan terms,
                            repayment schedule, applicable deductions, and other
                            obligations connected with this application.
                        </p>
                        <p>
                            I also understand that submitting this application
                            does not automatically guarantee approval of the
                            requested loan.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4">
                        <Checkbox
                            id="loan-agreement"
                            checked={isChecked}
                            onCheckedChange={(checked) => setIsChecked(checked === true)}
                            className="mt-1"
                        />
                        <Label
                            htmlFor="loan-agreement"
                            className="cursor-pointer text-sm leading-6 text-slate-700"
                        >
                            I have read and agree to the terms stated above, and
                            I understand that my loan application will be
                            submitted for review once I continue.
                        </Label>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={!isChecked || processing}
                    >
                        {processing ? 'Submitting...' : 'Agree and Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
