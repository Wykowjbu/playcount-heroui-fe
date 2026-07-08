import {
  Card, CardContent, CardHeader, CardTitle,
  Button, ButtonGroup,
  Table,
  Chip,
  SearchField,
} from "@heroui/react";

import Sliders from "@gravity-ui/icons/Sliders";
import BarsAscendingAlignLeft from "@gravity-ui/icons/BarsAscendingAlignLeft";
import LayoutColumns from "@gravity-ui/icons/LayoutColumns";
import Eye from "@gravity-ui/icons/Eye";

type PriorityItem = {
  id: number;
  type: "Venue" | "Owner" | "Review";
  name: string;
  sender: string;
  status: "Chờ duyệt" | "Bị báo cáo";
  time: string;
};

const PRIORITY_DATA: PriorityItem[] = [
  { id: 1, type: "Venue", name: "Sân Cầu Lông ABC", sender: "Nguyễn Văn A", status: "Chờ duyệt", time: "2 giờ trước" },
  { id: 2, type: "Owner", name: "Hồ sơ chủ sân Minh Sport", sender: "Trần Văn B", status: "Chờ duyệt", time: "5 giờ trước" },
  { id: 3, type: "Review", name: '"Sân không đúng mô tả..."', sender: "User ẩn danh", status: "Bị báo cáo", time: "Hôm qua" },
  { id: 4, type: "Venue", name: "Pickleball Đà Nẵng", sender: "Lê Văn C", status: "Chờ duyệt", time: "Hôm qua" },
];

export function AdminPriorityTable() {
  return (
    <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Hàng chờ ưu tiên</CardTitle>
        <div className="flex items-center gap-2">
          <ButtonGroup>
            <Button variant="ghost" size="sm">
              <Sliders className="w-4 h-4 mr-1.5" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <BarsAscendingAlignLeft className="w-4 h-4 mr-1.5" />
              Sort
            </Button>
            <Button variant="ghost" size="sm">
              <LayoutColumns className="w-4 h-4 mr-1.5" />
              Columns
            </Button>
          </ButtonGroup>
          <SearchField name="queue-search" variant="primary" className="hidden lg:flex w-48">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Tìm trong hàng chờ..." />
            </SearchField.Group>
          </SearchField>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table aria-label="Hàng chờ ưu tiên">
          <Table.Content>
            <Table.Header>
              <Table.Column>Loại</Table.Column>
              <Table.Column>Tên/Nội dung</Table.Column>
              <Table.Column>Người gửi</Table.Column>
              <Table.Column>Trạng thái</Table.Column>
              <Table.Column>Thời gian</Table.Column>
              <Table.Column>Action</Table.Column>
            </Table.Header>
            <Table.Body items={PRIORITY_DATA}>
              {(item) => (
                <Table.Row>
                  <Table.Cell>{item.type}</Table.Cell>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>{item.sender}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      size="sm"
                      color={item.status === "Chờ duyệt" ? "warning" : "danger"}
                      variant="soft"
                    >
                      {item.status}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>{item.time}</Table.Cell>
                  <Table.Cell>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table>
      </CardContent>
    </Card>
  );
}
