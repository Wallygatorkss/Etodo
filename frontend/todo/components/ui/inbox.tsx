"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTodos, TodoItem } from "../../hook/useTodos";

type InboxProps = {
  className?: string;
};

export default function Inbox({ className }: InboxProps) {
  const { todos, createTodo, updateTodo, deleteTodo, moveTodo, loading, fetchTodos } = useTodos();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  const [draftDueTime, setDraftDueTime] = React.useState("12:00");
  const [draftState, setDraftState] = React.useState<"not started" | "todo" | "in progress" | "done">("not started");
  const [draftColor, setDraftColor] = React.useState<string>("#fef3c7");

  // NE MONTRER QUE LES TACHES NON ASSIGNÉES
  const inboxTodos = todos.filter(t => t.container_id == null);

  React.useEffect(() => {
    const handler = () => fetchTodos();
    window.addEventListener("etodo:todos-updated", handler);
    return () => window.removeEventListener("etodo:todos-updated", handler);
  }, [fetchTodos]);

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setDraftTitle(todo.title);
    setDraftBody(todo.description);
    if (todo.due_time) {
      const timePart = todo.due_time.split(" ")[1]; // "HH:MM:SS"
      setDraftDueTime(timePart?.slice(0, 5) ?? "12:00"); // prend HH:MM
    } else {
      setDraftDueTime("12:00");
    }
    setDraftState(todo.status);
    setDraftColor(todo.color ?? "#fef3c7");
  };

  // Convertit draftDueTime "HH:MM" en DATETIME MySQL "YYYY-MM-DD HH:MM:SS"
  const getFormattedDueTime = () => {
    // Construit une chaîne datetime locale au format YYYY-MM-DD HH:MM:SS pour éviter les conversions de fuseau horaire
    const now = new Date();
    const [hours, minutes] = draftDueTime.split(":");
    now.setHours(parseInt(hours, 10));
    now.setMinutes(parseInt(minutes, 10));
    now.setSeconds(0);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };

  const saveEdit = async (id: number) => {
    const resp = await updateTodo(id, {
      title: draftTitle,
      description: draftBody,
      status: draftState,
      due_time: getFormattedDueTime(),
      color: draftColor,

    });
    // Si on a gagné des gemmes via passage à "done", on notifie immédiatement le header
    if (resp && draftState === 'done' && resp.awardGems) {
      // Animation : gemme volante vers le header
      try {
        const headerGem = document.querySelector('.gemme-image') as HTMLElement | null;
        if (headerGem) {
          const targetRect = headerGem.getBoundingClientRect();
          const cardRect = (document.querySelector(`[key="todo-${id}"]`) as HTMLElement | null)?.getBoundingClientRect?.();
          const startX = (cardRect?.left ?? targetRect.left) + (cardRect?.width ?? 0) / 2;
          const startY = (cardRect?.top ?? targetRect.top) + (cardRect?.height ?? 0) / 2;
          const img = document.createElement('img');
          img.src = '/clash/image_fond/gems-icon-r-removebg-preview.png';
          img.className = 'flying-gem';
          img.style.left = `${startX}px`;
          img.style.top = `${startY}px`;
          document.body.appendChild(img);
          const duration = 600;
          const start = performance.now();
          const startRect = { x: startX, y: startY };
          const endRect = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };
          const animate = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // easeInOut
            const x = startRect.x + (endRect.x - startRect.x) * ease;
            const y = startRect.y + (endRect.y - startRect.y) * ease;
            img.style.left = `${x}px`;
            img.style.top = `${y}px`;
            img.style.transform = `scale(${1 + 0.2 * (1 - Math.abs(1 - 2 * p))})`;
            if (p < 1) requestAnimationFrame(animate); else { img.remove(); }
          };
          requestAnimationFrame(animate);
        }
      } catch { }

      const n = Number(resp.awardGems) || 0;
      if (n > 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('etodo:gems-awarded', { detail: { amount: n, total: resp.gems } }));
      }
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const addCard = async () => {
    await createTodo({
      title: "Nouvelle tâche",
      description: "Description",
      status: "not started",
      due_time: getFormattedDueTime(),
      color: draftColor,
    });
  };

  const removeCard = async (id: number) => {
    await deleteTodo(id);
    if (editingId === id) setEditingId(null);
  };

  const onDragStartFromInbox = (item: TodoItem) => (e: React.DragEvent) => {
    const payload = { itemId: item.id, from: "inbox" as const, data: item };
    e.dataTransfer.setData("application/x-etodo-item", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDropToInbox = async (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-etodo-item");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { itemId?: number; from?: any };
      if (!payload?.itemId) return;
      // Déplace la tâche de nouveau vers la boîte de réception (container_id = null)
      await moveTodo(payload.itemId, null);
    } catch (err) {
      /* ignore */
    }
  };
  // supp les tasks quand on recoit l'event
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ itemId: number }>;
      const itemId = e.detail?.itemId;
      if (typeof itemId === "number") {
        removeCard(itemId);
      }
    };
    window.addEventListener("etodo:remove-from-inbox" as any, handler as EventListener);
    return () => {
      window.removeEventListener("etodo:remove-from-inbox" as any, handler as EventListener);
    };
  }, []);

  return (
    <aside className={`h-screen min-w-[280px] max-w-[280px] bg-white dark:bg-[#0d1117] shadow-lg border border-slate-200 dark:border-[#30363d] rounded-lg mx-[1vw] my-[1vh] flex flex-col ${className ?? ""}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg text-slate-900 dark:text-[#c9d1d9] font-semibold">Tâches</h2>
        <div className="flex gap-2">
          <Button
            className="hover:bg-slate-100 dark:hover:bg-[#161b22] text-slate-700 dark:text-[#8b949e]"
            variant="ghost"
            size="sm"
            onClick={addCard}
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 rounded-b-lg bg-slate-50 dark:bg-[#161b22] overflow-auto ring-1 ring-slate-50 dark:ring-0" onDragOver={onDragOver} onDrop={onDropToInbox}>
        <div className="space-y-3">
          {inboxTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            return (
              <Card
                key={`todo-${todo.id}`}
                className={`shadow-sm border-l-4 border-l-slate-400 dark:border-l-[#58a6ff] dark:bg-[#1c2128] hover:shadow-md hover:border-slate-300 transition-shadow  ${!isEditing ? "cursor-move" : ""}`}
                style={{ borderLeftColor: todo.color ?? undefined }}
                draggable={!isEditing}
                onDragStart={!isEditing ? onDragStartFromInbox(todo) : undefined}
              >
                <div onClick={() => !isEditing && startEdit(todo)} className="cursor-pointer">
                  <CardHeader>
                    {isEditing ? (
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full text-sm font-medium border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-2 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] focus:ring-2 focus:ring-slate-400 dark:focus:ring-[#58a6ff]"
                        autoFocus
                      />
                    ) : (
                      <CardTitle className="text-sm text-slate-900 dark:text-[#c9d1d9] font-semibold flex items-center gap-2">
                        {todo.title}
                        {((todo.rewardGemsMin ?? 0) > 0 && (todo.rewardGemsMax ?? 0) > 0) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 " title={`Récompense aléatoire: ${todo.rewardGemsMin}-${todo.rewardGemsMax}`}>

                            <img src="/clash/image_fond/gems-icon-r-removebg-preview.png" alt="Gemme" className="w-6 h-6 object-contain" />
                          </span>
                        )}
                      </CardTitle>
                    )}
                  </CardHeader>

                  <CardContent className="text-sm text-muted-foreground dark:text-slate-300">
                    {isEditing ? (
                      <>
                        <textarea
                          value={draftBody}
                          onChange={(e) => setDraftBody(e.target.value)}
                          className="w-full text-sm border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-2 resize-y bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] focus:ring-2 focus:ring-slate-400 dark:focus:ring-[#58a6ff]"
                          rows={4}
                        />
                        <input
                          type="time"
                          value={draftDueTime}
                          onChange={(e) => setDraftDueTime(e.target.value)}
                          className="w-full text-sm border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-2 mb-2 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] focus:ring-2 focus:ring-slate-400 dark:focus:ring-[#58a6ff]"
                        />
                        <select
                          value={draftState}
                          onChange={(e) =>
                            setDraftState(
                              e.target.value as "not started" | "todo" | "in progress" | "done"
                            )
                          }
                          className="w-full text-sm border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-2 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] focus:ring-2 focus:ring-slate-400 dark:focus:ring-[#58a6ff]"
                        >
                          <option value="not started">Not Started</option>
                          <option value="todo">To Do</option>
                          <option value="in progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                        <div className="mt-2">
                          <label className="text-xs mr-2">Couleur:</label>
                          <input type="color" value={draftColor} onChange={(e) => setDraftColor(e.target.value)} className="w-10 h-8 align-middle" />
                        </div>
                      </>
                    ) : (
                      <div>{todo.description}</div>
                    )}
                  </CardContent>
                </div>

                {isEditing && (
                  <div className="flex p-4 gap-2 flex-wrap border-t border-slate-200 dark:border-[#30363d]">
                    <Button className="flex-1 min-w-[70px]" size="sm" onClick={() => saveEdit(todo.id)}>
                      Save
                    </Button>
                    <Button className="flex-1 min-w-[70px]" size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button className="w-full mt-1" size="sm" variant="destructive" onClick={() => removeCard(todo.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          {inboxTodos.length === 0 && (
            <div className="text-sm text-center text-slate-400 dark:text-[#8b949e] border-2 border-dashed border-slate-300 dark:border-[#30363d] rounded-lg p-4 bg-slate-100 dark:bg-[#161b22]">
              Ajoutez de nouvelles tâches
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
