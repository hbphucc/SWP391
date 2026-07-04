import { Tag } from "antd";

export function getStatusTag(status: string) {
  switch (status) {
    case "Pending":
      return <Tag color="warning">Pending</Tag>;
    case "Accepted":
      return <Tag color="success">Accepted</Tag>;
    case "Rejected":
      return <Tag color="error">Rejected</Tag>;
    case "Cancelled":
      return <Tag color="default">Cancelled</Tag>;
    default:
      return <Tag color="default">{status}</Tag>;
  }
}
