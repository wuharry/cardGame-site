"use client";

import { useState } from "react";

const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

/**
 * 3D 像素骰子互動組件
 * 實裝官方 Godot 4.7 R5「六面像素風 3D 演出、翻滾停穩、六點爆擊」的網頁互動微模型。
 */
export function PixelDice() {
  const [result, setResult] = useState<number | null>(6);
  const [isRolling, setIsRolling] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 180 }); // 預設顯示 6 點
  const [spinCount, setSpinCount] = useState(1);

  function rollDice() {
    if (isRolling) return;
    setIsRolling(true);

    const nextResult = Math.floor(Math.random() * 6) + 1;
    const target = FACE_ROTATIONS[nextResult];
    const newSpins = spinCount + 2;
    setSpinCount(newSpins);

    // 隨機翻滾圈數 + 停穩目標角度
    const nextX = newSpins * 360 + target.x;
    const nextY = newSpins * 360 + target.y;

    setRotation({ x: nextX, y: nextY });

    setTimeout(() => {
      setResult(nextResult);
      setIsRolling(false);
    }, 1100);
  }

  const isCrit = result === 6 && !isRolling;

  return (
    <div className="plate notch border border-brass-dim/80 bg-ink/90 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 左側：3D 骰子舞臺 */}
        <div className="flex items-center gap-5">
          <div
            className="flex h-20 w-20 items-center justify-center select-none"
            style={{ perspective: "600px" }}
          >
            {/* 3D 骰子剛體 */}
            <div
              className="relative h-12 w-12 transition-transform duration-[1100ms]"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transitionTimingFunction: "cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            >
              {/* 1 點 (前) */}
              <DiceFace transform="rotateY(0deg) translateZ(24px)">
                <Pip lit={false} center />
              </DiceFace>

              {/* 6 點 (後) - 爆擊面 */}
              <DiceFace transform="rotateY(180deg) translateZ(24px)" isGold={isCrit}>
                <div className="flex h-full w-full justify-between p-1.5">
                  <div className="flex flex-col justify-between">
                    <Pip lit={isCrit} />
                    <Pip lit={isCrit} />
                    <Pip lit={isCrit} />
                  </div>
                  <div className="flex flex-col justify-between">
                    <Pip lit={isCrit} />
                    <Pip lit={isCrit} />
                    <Pip lit={isCrit} />
                  </div>
                </div>
              </DiceFace>

              {/* 2 點 (右) */}
              <DiceFace transform="rotateY(90deg) translateZ(24px)">
                <div className="flex h-full w-full justify-between p-1.5">
                  <Pip lit={false} />
                  <div className="self-end">
                    <Pip lit={false} />
                  </div>
                </div>
              </DiceFace>

              {/* 5 點 (左) */}
              <DiceFace transform="rotateY(-90deg) translateZ(24px)">
                <div className="relative h-full w-full p-1.5">
                  <div className="flex justify-between">
                    <Pip lit={false} />
                    <Pip lit={false} />
                  </div>
                  <Pip lit={false} center />
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                    <Pip lit={false} />
                    <Pip lit={false} />
                  </div>
                </div>
              </DiceFace>

              {/* 3 點 (上) */}
              <DiceFace transform="rotateX(90deg) translateZ(24px)">
                <div className="relative h-full w-full p-1.5">
                  <Pip lit={false} />
                  <Pip lit={false} center />
                  <div className="absolute bottom-1.5 right-1.5">
                    <Pip lit={false} />
                  </div>
                </div>
              </DiceFace>

              {/* 4 點 (下) */}
              <DiceFace transform="rotateX(-90deg) translateZ(24px)">
                <div className="flex h-full w-full flex-col justify-between p-1.5">
                  <div className="flex justify-between">
                    <Pip lit={false} />
                    <Pip lit={false} />
                  </div>
                  <div className="flex justify-between">
                    <Pip lit={false} />
                    <Pip lit={false} />
                  </div>
                </div>
              </DiceFace>
            </div>
          </div>

          {/* 骰子狀態與數值反饋 */}
          <div>
            <div className="flex items-center gap-2">
              <span className="hud-label text-[0.62rem] text-brass">3D 像素骰系統</span>
              {isCrit ? (
                <span className="animate-pulse border border-brass bg-brass px-1.5 py-0.2 text-[0.62rem] font-bold text-ink">
                  💥 6點爆擊 CRITICAL!
                </span>
              ) : isRolling ? (
                <span className="text-[0.68rem] text-quill italic animate-pulse">
                  翻滾判定中...
                </span>
              ) : (
                <span className="text-[0.68rem] text-quill">
                  停穩結果：<strong className="text-parchment">{result} 點</strong>
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.74rem] text-faint">
              Godot 4.7 官方 3D 演出：投擲擲出 6 點將觸發特殊高光與致命爆發效果！
            </p>
          </div>
        </div>

        {/* 右側：投擲按鈕 */}
        <button
          type="button"
          onClick={rollDice}
          disabled={isRolling}
          className="shrink-0 border border-brass bg-brass/15 px-4 py-2 text-xs font-bold text-brass-hi transition-all hover:bg-brass/30 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm font-hud"
        >
          {isRolling ? "🎲 翻滾中..." : "🎲 點擊投擲 3D 像素骰"}
        </button>
      </div>
    </div>
  );
}

function DiceFace({
  transform,
  children,
  isGold = false,
}: {
  transform: string;
  children: React.ReactNode;
  isGold?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center border transition-colors ${
        isGold
          ? "border-brass bg-brass/25 shadow-[0_0_12px_rgba(200,162,60,0.6)]"
          : "border-brass-dim bg-panel"
      }`}
      style={{
        transform,
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Pip({ lit, center = false }: { lit: boolean; center?: boolean }) {
  return (
    <span
      className={`block h-2 w-2 rounded-xs transition-colors ${
        lit ? "bg-brass-hi shadow-[0_0_6px_#e8cd77]" : "bg-quill/70"
      } ${
        center
          ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          : ""
      }`}
    />
  );
}
