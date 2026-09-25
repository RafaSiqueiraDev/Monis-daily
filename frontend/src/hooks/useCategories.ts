import { useQuery } from "@tanstack/react-query";
import { listCategories } from "../api/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 5 * 60_000, // categorias mudam raramente — cache mais longo que o resto
  });
}