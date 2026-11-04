import { createEffect, createSignal, For } from "solid-js";
import { mount, prompt, useSettings, useSize, useStorage, type Style } from "@vitrine/sdk";
import { Surface, clamp, type Look, useLook } from "../shared/look";
import { BODY, DISPLAY } from "../shared/fonts";

// Tasks under a stacked Bebas Neue heading, each with a small open ring that fills with the
// accent when the task is done.

interface Item {
  id: string;
  text: string;
  done: boolean;
}

const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const splitSeed = (raw: string) =>
  raw
    .split(/[;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
/** The engine's text flyout (Vitrine 2.0+); without it tasks come from the settings. */
const canPrompt = () => typeof (globalThis as any).__vitrine?.prompt === "function";
// textDecoration is newer than the SDK typings of this release.
const strike = (on: boolean) => ({ textDecoration: on ? "line-through" : "none" }) as unknown as Style;

function Ring(props: { l: Look; done: boolean; hover: boolean; d: number }) {
  const r = () => props.d / 2 - 1.5;
  return (
    <svg width={props.d} height={props.d} viewBox={`0 0 ${props.d} ${props.d}`}>
      {props.l.halo ? <circle cx={props.d / 2} cy={props.d / 2} r={r()} fill="none" stroke={props.l.halo} strokeWidth={4} /> : null}
      <circle
        cx={props.d / 2}
        cy={props.d / 2}
        r={r()}
        fill={props.done ? props.l.accent : "none"}
        stroke={props.done || props.hover ? props.l.accent : props.l.text2}
        strokeWidth={1.6}
      />
      {props.done ? (
        <path
          d={`M ${props.d * 0.3} ${props.d * 0.52} L ${props.d * 0.44} ${props.d * 0.66} L ${props.d * 0.71} ${props.d * 0.37}`}
          fill="none"
          stroke={props.l.onAccent}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

function Row(props: { l: Look; item: Item; fs: number; h: number; editable: boolean; onToggle: () => void; onEdit: () => void }) {
  const [hover, setHover] = createSignal(false);
  const [hoverEdit, setHoverEdit] = createSignal(false);
  const small = () => Math.max(8, Math.round(props.fs * 0.66));
  return (
    <view
      onClick={props.onToggle}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{ height: props.h, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: Math.round(props.fs * 0.75) }}
    >
      <Ring l={props.l} done={props.item.done} hover={hover()} d={Math.round(props.fs * 1.35)} />
      <text
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: BODY,
          fontSize: props.fs,
          color: props.item.done ? props.l.text3 : props.l.text,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          ...strike(props.item.done),
        }}
      >
        {props.item.text}
      </text>
      {props.editable ? (
        <view
          onClick={(e) => (e.stopPropagation(), props.onEdit())}
          onPointerEnter={() => setHoverEdit(true)}
          onPointerLeave={() => setHoverEdit(false)}
          style={{ paddingHorizontal: 4, paddingVertical: 4, opacity: hover() ? 1 : 0, transition: "opacity 150ms ease" }}
        >
          <text style={{ fontFamily: BODY, fontSize: small(), letterSpacing: 1, color: hoverEdit() ? props.l.accent : props.l.text3 }}>EDIT</text>
        </view>
      ) : null}
    </view>
  );
}

function Todo() {
  const s = useSettings({
    theme: "dark",
    accent: "#40C4FF",
    background: "none",
    shadow: true,
    title: "To do",
    items: "",
    hideDone: false,
  });
  const l = useLook(s);
  const size = useSize();
  const [items, setItems] = useStorage<Item[] | null>("items", null);
  const [seed, setSeed] = useStorage<string>("seed", "");
  const [scroll, setScroll] = createSignal(0);
  const [hoverAdd, setHoverAdd] = createSignal(false);
  const [hoverClear, setHoverClear] = createSignal(false);

  // Tasks typed into the settings are added once; the list itself lives in widget storage.
  createEffect(() => {
    const raw = String(s().items ?? "");
    if (raw === seed() && items() !== null) return;
    const have = new Set((items() ?? []).map((i) => i.text.toLowerCase()));
    const added = splitSeed(raw)
      .filter((t) => !have.has(t.replace(/^\[x\]\s*/i, "").toLowerCase()) && !splitSeed(seed()).includes(t))
      .map((t) => ({ id: newId(), text: t.replace(/^\[x\]\s*/i, ""), done: /^\[x\]/i.test(t) }));
    setSeed(raw);
    if (added.length || items() === null) setItems([...(items() ?? []), ...added]);
  });

  const all = () => items() ?? [];
  const visible = () => (s().hideDone ? all().filter((i) => !i.done) : all());
  const left = () => all().filter((i) => !i.done).length;
  const doneCount = () => all().length - left();
  const editable = canPrompt();

  const pad = () => (l().card ? 16 : 6);
  const fs = () => Math.floor(clamp(Math.min(size().width / 22, size().height / 13), 11, 20));
  const rowH = () => Math.round(fs() * 2.1);
  const headFs = () => Math.round(fs() * 2.9);
  const headH = () => Math.round(headFs() * 1.05);
  const capacity = () => Math.max(1, Math.floor((size().height - pad() * 2 - headH() - fs() * 0.6 - (editable ? rowH() : 0)) / rowH()));
  const maxScroll = () => Math.max(0, visible().length - capacity());
  const first = () => clamp(scroll(), 0, maxScroll());
  const shown = () => visible().slice(first(), first() + capacity());

  const byId = (id: string) => all().find((i) => i.id === id) ?? { id, text: "", done: false };
  const toggle = (id: string) => setItems(all().map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const add = async () => {
    const text = await prompt({ title: "New task", placeholder: "What needs doing?" });
    if (text && text.trim()) {
      setItems([...all(), { id: newId(), text: text.trim(), done: false }]);
      setScroll(Number.MAX_SAFE_INTEGER);
    }
  };
  const edit = async (item: Item) => {
    const text = await prompt({ title: "Edit task", placeholder: "Leave empty to delete", value: item.text });
    if (text === null) return;
    const t = text.trim();
    setItems(t ? all().map((i) => (i.id === item.id ? { ...i, text: t } : i)) : all().filter((i) => i.id !== item.id));
  };
  const status = () => (all().length === 0 ? "" : left() === 0 ? "ALL DONE" : `${left()} LEFT`);

  return (
    <Surface l={l()} style={{ flexDirection: "column", padding: pad() }}>
      {(c) => (
        <>
          <view style={{ height: headH(), flexShrink: 0, flexDirection: "row", alignItems: "flex-end", gap: Math.round(fs() * 0.6), marginBottom: fs() * 0.6 }}>
            <text style={{ fontFamily: DISPLAY, fontSize: headFs(), lineHeight: 0.9, color: c.text, whiteSpace: "nowrap" }}>
              {(s().title || "To do").toUpperCase()}
            </text>
            <text style={{ fontFamily: DISPLAY, fontSize: Math.round(headFs() * 0.5), lineHeight: 1.1, color: c.accent, whiteSpace: "nowrap" }}>
              {status()}
            </text>
            <view style={{ flex: 1 }} />
            {doneCount() > 0 && size().width >= 200 ? (
              <view
                onClick={() => setItems(all().filter((i) => !i.done))}
                onPointerEnter={() => setHoverClear(true)}
                onPointerLeave={() => setHoverClear(false)}
                style={{ paddingVertical: 3, paddingLeft: 6 }}
              >
                <text
                  style={{
                    fontFamily: BODY,
                    fontSize: Math.max(8, Math.round(fs() * 0.66)),
                    letterSpacing: 1,
                    color: hoverClear() ? c.accent : c.text2,
                    whiteSpace: "nowrap",
                  }}
                >
                  CLEAR DONE
                </text>
              </view>
            ) : null}
          </view>
          <view
            onWheel={(e) => setScroll(clamp(first() + ((e.deltaY ?? 0) > 0 ? 1 : -1), 0, maxScroll()))}
            style={{ flex: 1, flexDirection: "column", minHeight: 0 }}
          >
            <For each={shown().map((i) => i.id)}>
              {(id) => (
                <Row l={c} item={byId(id)} fs={fs()} h={rowH()} editable={editable} onToggle={() => toggle(id)} onEdit={() => edit(byId(id))} />
              )}
            </For>
            {all().length === 0 && !editable ? (
              <text style={{ fontFamily: BODY, fontSize: fs(), color: c.text2 }}>Add tasks in the widget settings</text>
            ) : null}
            {editable && shown().length <= capacity() ? (
              <view
                onClick={add}
                onPointerEnter={() => setHoverAdd(true)}
                onPointerLeave={() => setHoverAdd(false)}
                style={{ height: rowH(), flexShrink: 0, flexDirection: "row", alignItems: "center", gap: Math.round(fs() * 0.75) }}
              >
                <svg width={Math.round(fs() * 1.35)} height={Math.round(fs() * 1.35)} viewBox="0 0 20 20">
                  <path d="M 10 4.5 L 10 15.5 M 4.5 10 L 15.5 10" stroke={c.accent} strokeWidth={1.8} strokeLinecap="round" />
                </svg>
                <text
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: Math.round(fs() * 1.3),
                    lineHeight: 1,
                    letterSpacing: 0.5,
                    color: c.accent,
                    opacity: hoverAdd() ? 1 : 0.85,
                    whiteSpace: "nowrap",
                  }}
                >
                  ADD A TASK
                </text>
              </view>
            ) : null}
          </view>
        </>
      )}
    </Surface>
  );
}

mount(() => <Todo />);
