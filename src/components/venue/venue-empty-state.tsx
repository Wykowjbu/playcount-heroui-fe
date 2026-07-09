"use client";

import { Button, Chip } from "@heroui/react";
import Magnifier from "@gravity-ui/icons/Magnifier";
import Xmark from "@gravity-ui/icons/Xmark";

interface Props {
  activeFilters: string[];
  onClearFilters: () => void;
}

export function VenueEmptyState({ activeFilters, onClearFilters }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <Magnifier className="w-16 h-16 text-muted/30 mb-6" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Không tìm thấy sân phù hợp
      </h3>
      <p className="text-sm text-muted max-w-md mb-6">
        Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm
      </p>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {activeFilters.map((f) => (
            <Chip key={f} size="sm" variant="primary">
              {f}
            </Chip>
          ))}
        </div>
      )}

      <Button variant="outline" onPress={onClearFilters}>
        <Xmark className="w-4 h-4 mr-1" />
        Xóa bộ lọc
      </Button>
    </div>
  );
}
