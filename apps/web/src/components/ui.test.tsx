import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './ui';

function Harness({ busy = false, onClose = vi.fn() }: { busy?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  const close = () => { onClose(); setOpen(false); };
  return <><button>Origin</button><Modal open={open} title="Add employee" description="Create a workforce identity" busy={busy} error="Employee number is required" onClose={close} footer={<button form="test-form" disabled={busy}>Save</button>}><form id="test-form"><label>Employee number<input required /></label></form></Modal></>;
}

describe('Modal', () => {
  it('renders an accessible dialog, description, error, and required form fields', () => { render(<Harness />); expect(screen.getByRole('dialog', { name: 'Add employee' })).toHaveAttribute('aria-modal', 'true'); expect(screen.getByText('Create a workforce identity')).toBeVisible(); expect(screen.getByRole('alert')).toHaveTextContent('Employee number is required'); expect(screen.getByLabelText('Employee number')).toBeRequired(); });
  it('closes with Escape, the close button, and the backdrop', () => { const escape = vi.fn(); const first=render(<Harness onClose={escape} />); fireEvent.keyDown(document, { key: 'Escape' }); expect(escape).toHaveBeenCalledOnce(); first.unmount(); const close=vi.fn();const second=render(<Harness onClose={close}/>);fireEvent.click(screen.getByRole('button',{name:'Close Add employee'}));expect(close).toHaveBeenCalledOnce();second.unmount();const backdrop=vi.fn();render(<Harness onClose={backdrop}/>);fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);expect(backdrop).toHaveBeenCalledOnce(); });
  it('blocks dismissal and submission while busy', () => { const close = vi.fn(); render(<Harness busy onClose={close} />); fireEvent.keyDown(document, { key: 'Escape' }); fireEvent.mouseDown(screen.getByRole('dialog').parentElement!); expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Close Add employee' })).toBeDisabled(); });
});
