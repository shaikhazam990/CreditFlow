import { useDispatch, useSelector } from "react-redux";
import { fetchEmailLogs, sendEmailThunk, previewEmailThunk, clearPreview } from "../emailsSlice";

const useEmails = () => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.emails);

  const loadLogs = (params) => dispatch(fetchEmailLogs(params));
  const send = (invoiceId, stage, dryRun) => dispatch(sendEmailThunk({ invoiceId, stage, dryRun }));
  const preview = (invoiceId, stage) => dispatch(previewEmailThunk({ invoiceId, stage }));
  const resetPreview = () => dispatch(clearPreview());

  return { ...state, loadLogs, send, preview, resetPreview };
};

export default useEmails;
