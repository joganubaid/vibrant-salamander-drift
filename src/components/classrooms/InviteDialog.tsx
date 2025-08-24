import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  joinCode: string;
}

export const InviteDialog = ({ open, onOpenChange, joinCode }: InviteDialogProps) => {
  const inviteLink = `${window.location.origin}/join/${joinCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    showSuccess('Invite link copied to clipboard!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Students</DialogTitle>
          <DialogDescription>
            Share this link or QR code with students to let them join your classroom.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <QRCodeCanvas value={inviteLink} size={160} />
          <div className="flex items-center space-x-2 w-full">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" defaultValue={inviteLink} readOnly />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};