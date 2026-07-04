import { useMemo } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

type DateTimePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function DateTimePickerField({ value, onChange, disabled = false }: DateTimePickerFieldProps) {
  const pickerValue = useMemo(() => value && dayjs(value).isValid() ? dayjs(value) : null, [value]);

  return (
    <DatePicker
      showTime={{ format: "hh:mm A", use12Hours: true, minuteStep: 5 }}
      format="DD/MM/YYYY hh:mm A"
      value={pickerValue}
      onChange={(nextValue) => onChange(nextValue ? nextValue.format("YYYY-MM-DDTHH:mm") : "")}
      disabled={disabled}
      allowClear={false}
      inputReadOnly
      placeholder="DD/MM/YYYY hh:mm AM/PM"
      style={{ width: "100%", minHeight: 50, paddingInline: 16 }}
    />
  );
}
