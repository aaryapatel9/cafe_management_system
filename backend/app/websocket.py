from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._order_channels: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect_order(self, order_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._order_channels[order_id].add(websocket)

    def disconnect_order(self, order_id: int, websocket: WebSocket) -> None:
        sockets = self._order_channels.get(order_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._order_channels.pop(order_id, None)

    async def broadcast_order(self, order_id: int, payload: dict[str, Any]) -> None:
        sockets = list(self._order_channels.get(order_id, set()))
        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect_order(order_id, websocket)


manager = ConnectionManager()
