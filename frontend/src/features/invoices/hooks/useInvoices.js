import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchInvoices, createInvoice, updateInvoice,
  deleteInvoice, markPaid, fetchDashboard,
} from "../invoicesSlice";

const useInvoices = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.invoices);

  const load = useCallback((params) => dispatch(fetchInvoices(params)), [dispatch]);
  const loadDashboard = useCallback(() => dispatch(fetchDashboard()), [dispatch]);
  const create = useCallback((data) => dispatch(createInvoice(data)), [dispatch]);
  const update = useCallback((id, payload) => dispatch(updateInvoice({ id, payload })), [dispatch]);
  const remove = useCallback((id) => dispatch(deleteInvoice(id)), [dispatch]);
  const setPaid = useCallback((id) => dispatch(markPaid(id)), [dispatch]);

  return { ...state, load, loadDashboard, create, update, remove, setPaid };
};

export default useInvoices;
