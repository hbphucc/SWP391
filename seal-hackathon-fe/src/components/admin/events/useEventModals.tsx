import { App, Input } from "antd";

/**
 * Promise-based wrappers around AntD's imperative `modal` API. They give the
 * same shape as window.confirm/prompt (await → boolean / string | null), so
 * call sites stay readable while getting theme-consistent dialogs.
 */
export function useEventModals() {
  const { modal } = App.useApp();

  const confirmAsync = (title: string, content?: string): Promise<boolean> =>
    new Promise((resolve) => {
      modal.confirm({
        title,
        content,
        okText: "Confirm",
        cancelText: "Cancel",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  const promptReasonAsync = (title: string, placeholder?: string): Promise<string | null> =>
    new Promise((resolve) => {
      let value = "";
      modal.confirm({
        title,
        content: <Input.TextArea rows={3} placeholder={placeholder} onChange={(e) => { value = e.target.value; }} />,
        okText: "Submit",
        cancelText: "Cancel",
        onOk: () => resolve(value),
        onCancel: () => resolve(null),
      });
    });

  return { confirmAsync, promptReasonAsync };
}
