import { useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useBulkCreateInvestmentAssets } from "../../hooks/useInvestmentAssets";
import { ASSET_CATEGORY_LABELS, SUPPORTED_CURRENCIES, type AssetCategory, type CurrencyCode } from "../../types/investment";

interface BulkRow {
  id: string;
  name: string;
  category: AssetCategory;
  currency: CurrencyCode;
  initial_balance: string;
}

const newRow = (): BulkRow => ({
  id: crypto.randomUUID(),
  name: "",
  category: "stock",
  currency: "EUR",
  initial_balance: "",
});

export function BulkAddAssetsDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([newRow(), newRow()]);
  const bulkCreate = useBulkCreateInvestmentAssets();

  const updateRow = (id: string, patch: Partial<BulkRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const handleSubmit = () => {
    const validRows = rows.filter((r) => r.name.trim() !== "");
    if (validRows.length === 0) return;

    bulkCreate.mutate(
      validRows.map((r) => ({
        name: r.name.trim(),
        category: r.category,
        currency: r.currency,
        initial_balance: r.initial_balance || null,
      })),
      {
        onSuccess: () => {
          setRows([newRow(), newRow()]);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setRows([newRow(), newRow()]); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layers className="h-4 w-4" />
          Adicionar em Lote
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar vários ativos</DialogTitle>
          <DialogDescription>Preenche as linhas que precisares — linhas sem nome são ignoradas.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-500">Nome</label>
                <Input
                  value={row.name}
                  placeholder="Ex: PPR XPTO"
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-500">Categoria</label>
                <Select value={row.category} onValueChange={(v) => updateRow(row.id, { category: v as AssetCategory })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-500">Moeda</label>
                <Select value={row.currency} onValueChange={(v) => updateRow(row.id, { currency: v as CurrencyCode })}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-slate-500">Saldo inicial</label>
                <Input
                  className="w-24"
                  placeholder="0,00"
                  value={row.initial_balance}
                  onChange={(e) => updateRow(row.id, { initial_balance: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="flex h-10 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={addRow} className="self-start">
          <Plus className="h-4 w-4" />
          Adicionar linha
        </Button>

        <div className="mt-2 flex justify-end gap-2">
          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
          <Button type="button" onClick={handleSubmit} isLoading={bulkCreate.isPending}>
            Guardar {rows.filter((r) => r.name.trim()).length || ""} ativo(s)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}