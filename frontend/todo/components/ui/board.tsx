"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTodos, useContainers, TodoItem, Column } from "../../hook/useTodos";
import { Button } from "@/components/ui/button";
import { Card as UICard, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Plus, MoreVertical, Image as ImageIcon, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BoardProps = {
  className?: string;
};

type DragPayload = {
  itemId: number;
};

type ContainerDragPayload = {
  containerId: number;
};

export default function Board({ className }: BoardProps) {
  const { todos, moveTodo, updateTodo, deleteTodo, fetchTodos } = useTodos();
  const { containers, fetchContainers, createContainer, updateContainer, deleteContainer, reorderContainers, error, loading } = useContainers();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftColor, setDraftColor] = useState<string>("#fef3c7");
  const [busy, setBusy] = useState(false);
  const [boardBackground, setBoardBackground] = useState<string>("");

  useEffect(() => {
    fetchContainers();
  }, []);

  // Charger l'image de fond depuis le profil utilisateur
  useEffect(() => {
    const fetchBoardBackground = async () => {
      try {
        const res = await fetch('http://localhost:3001/user', { credentials: 'include' });

        if (!res.ok) return;
        const data = await res.json();
        if (data.board_background) {
          setBoardBackground(data.board_background);
        }
      } catch (err) {
        console.error('Erreur récupération image de fond:', err);
      }
    };

    fetchBoardBackground();
  }, []);

  // Rafraîchit les tâches quand un autre composant signale une mise à jour (ex: déplacement vers la boîte de réception)
  useEffect(() => {
    const handler = () => {
      fetchTodos();
    };
    window.addEventListener('etodo:todos-updated', handler);
    return () => window.removeEventListener('etodo:todos-updated', handler);
  }, [fetchTodos]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onContainerDragStart = (containerId: number) => (e: React.DragEvent) => {
    // Si le drag and drop a commencé depuis une tâche à l'intérieur du conteneur, on n'initie PAS le drag du conteneur.

    try {
      const target = e.target as EventTarget | null;
      let el: HTMLElement | null = null;
      if (target instanceof HTMLElement) {
        el = target;
      } else if (target && (target as Node).nodeType === Node.TEXT_NODE) {
        // parentElement devrait etre un HTMLElement
        el = (target as Node).parentElement as HTMLElement | null;
      }
      if (el && el.closest && el.closest('[data-etodo-task]')) {
        // Un drag de tâche a démarré: on ignore le drag du conteneur.
        // Ne PAS appeler e.preventDefault() ici car cela annulerait le dragstart de l'élément enfant ;
        // on retourne simplement pour laisser le drag de la tâche continuer normalement.
        return;
      }
    } catch (err) {
      // Ignore l'erreur et autorise le drag du conteneur comme solution de repli.
    }
    const payload: ContainerDragPayload = { containerId };
    e.dataTransfer.setData("application/x-etodo-container", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const onContainerDrop = (targetId: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-etodo-container");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as ContainerDragPayload;
      const sourceId = payload.containerId;
      if (sourceId === targetId) return;
      // Calcul du nouvel ordre des conteneurs.
      const ids = containers.map(c => c.id);
      const fromIndex = ids.indexOf(sourceId);
      const toIndex = ids.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return;
      ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, sourceId);
      // Crée un nouvel ordre de conteneurs (conserve les propriétés existantes).
      const newOrder = ids.map(id => containers.find(c => c.id === id)!).filter(Boolean);
      // Mettre à jour immédiatement l'ordre local.
      await reorderContainers(ids);
    } catch (err) {
      console.error('container drop error', err);
    }
  };

  const onDropToColumn = (columnId: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-etodo-item");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as DragPayload;
      await moveTodo(payload.itemId, columnId);
    } catch {
      /* ignore */
    }
  };

  const onDragStartFromColumn = (itemId: number) => (e: React.DragEvent) => {
    const payload: DragPayload = { itemId };
    e.dataTransfer.setData("application/x-etodo-item", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const startEdit = (col: Column) => {
    setEditingId(col.id);
    setDraftTitle(col.title);
    setDraftColor((col as any).color ?? "#fef3c7");
  };

  // Édition des tâches à l'intérieur des colonnes
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [todoDraftTitle, setTodoDraftTitle] = useState("");
  const [todoDraftBody, setTodoDraftBody] = useState("");
  const [todoDraftDueTime, setTodoDraftDueTime] = useState("12:00");
  const [todoDraftState, setTodoDraftState] = useState<"not started" | "todo" | "in progress" | "done">("not started");
  const [todoDraftColor, setTodoDraftColor] = useState<string>("#fef3c7");
  const [hoveredTodoId, setHoveredTodoId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailTodo, setDetailTodo] = useState<any | null>(null);

  const AUTH_REDIRECT = "http://localhost:3000/login.html";

  const openTodoDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailTodo(null);
    try {
      const res = await fetch(`http://localhost:3001/todos/${id}`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') window.location.href = AUTH_REDIRECT;
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur de récupération');
      setDetailTodo(data);
    } catch (e: any) {
      setDetailError(e.message || String(e));
    } finally {
      setDetailLoading(false);
    }
  };

  const startEditTodo = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setTodoDraftTitle(todo.title);
    setTodoDraftBody(todo.description ?? "");
    if (todo.due_time) {
      const timePart = todo.due_time.split(" ")[1];
      setTodoDraftDueTime(timePart?.slice(0, 5) ?? "12:00");
    } else {
      setTodoDraftDueTime("12:00");
    }
    setTodoDraftState(todo.status);
    setTodoDraftColor(todo.color ?? "#fef3c7");
  };

  const saveEditTodo = async (id: number) => {
    const payload = {
      title: todoDraftTitle,
      description: todoDraftBody,
      status: todoDraftState,
      due_time: (() => {
        // Construit une date/heure locale au format YYYY-MM-DD HH:MM:SS pour éviter les conversions de fuseau horaire
        const now = new Date();
        const [hours, minutes] = todoDraftDueTime.split(":");
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
      })(),
      color: todoDraftColor,
    };

    try {
      console.log('board: updating todo', id, payload);
      const resp = await updateTodo(id, payload);
      // Si on vient de passer à done, afficher le toast et mettre à jour le compteur header
      if (payload.status === 'done' && resp && resp.awardGems) {
        const n = Number(resp.awardGems) || 0;
        if (n > 0) {
          toast.success(`+${n} gemmes gagnées`, { duration: 2000 });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('etodo:gems-awarded', { detail: { amount: n, total: resp.gems } }));
          }
        }
      }
      console.log('board: updateTodo succeeded for', id);
      // Notifie les autres composants (si updateTodo n'a pas déclenché de rafraîchissement)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('etodo:todos-updated'));
      setEditingTodoId(null);
    } catch (err) {
      console.error('board: updateTodo error', err);
      alert('Erreur lors de la mise à jour de la tâche.  Vérifie la console pour plus de détails.');
    }
  };

  const cancelEditTodo = () => setEditingTodoId(null);

  const removeTodo = async (id: number) => {
    await deleteTodo(id);
    if (editingTodoId === id) setEditingTodoId(null);
  };

  const toggleTodoDone = async (todo: TodoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // enregistre la position du clic pour déclencher une animation après confirmation côté serveur
    const startX = (e as any).clientX ?? 0;
    const startY = (e as any).clientY ?? 0;
    const newStatus = todo.status === "done" ? "todo" : "done";
    const resp = await updateTodo(todo.id, { status: newStatus });
    if (resp && resp.awardGems && newStatus === 'done') {
      const n = Number(resp.awardGems) || 0;
      if (n > 0) {
        // Anime uniquement quand des gemmes sont réellement attribuées (première collection effective)
        try {
          const headerGem = document.querySelector('.gemme-image') as HTMLElement | null;
          if (headerGem) {
            const targetRect = headerGem.getBoundingClientRect();
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
        toast.success(`+${n} gemmes gagnées`, { duration: 2000 });
        // déclenche un event que le header peut écouter pour refresh instantanément
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('etodo:gems-awarded', { detail: { amount: n, total: resp.gems } }));
        }
      }
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('etodo:todos-updated'));
  };

  const saveEdit = async (id: number) => {
    if (busy) return;
    setBusy(true);
    const updated = await updateContainer(id, draftTitle, draftColor);
    if (updated?.title) setDraftTitle(updated.title);
    setEditingId(null);
    setBusy(false);
  };

  const cancelEdit = () => setEditingId(null);

  const addColumn = async () => {
    if (busy) return;
    setBusy(true);
    const newTitle = "Nouvelle classe";
    const defaultColor = "#fef3c7";
    const created = await createContainer(newTitle, defaultColor);
    if (created?.id) {
      setEditingId(created.id);
      setDraftTitle(created.title);
      setDraftColor(created.color ?? defaultColor);
    }
    setBusy(false);
  };

  const deleteColumnHandler = async (id: number) => {
    if (busy) return;
    setBusy(true);
    const ok = await deleteContainer(id);
    if (ok && editingId === id) setEditingId(null);
    setBusy(false);
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("L'image est trop grande. Maximum 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string;
        setBoardBackground(imageDataUrl);

        // Sauvegarder dans la base de données
        try {
          const response = await fetch('http://localhost:3001/board-background', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ image: imageDataUrl })
          });

          if (!response.ok) {
            console.error("Erreur sauvegarde image de fond");
          }
        } catch (error) {
          console.error('Erreur:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundImage = async () => {
    setBoardBackground("");

    // Supprimer de la base de données
    try {
      await fetch('http://localhost:3001/board-background', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: null })
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <>
      <aside
        className={`h-screen grow bg-white dark:bg-[#0d1117] shadow-lg border border-slate-200 dark:border-[#30363d] rounded-lg mx-[1vw] my-[1vh] flex flex-col ${className ?? ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-[#30363d] rounded-t-lg bg-white dark:bg-[#0d1117] relative z-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-[#c9d1d9]">Tableau de bord</h2>
          <div className="flex gap-2 items-center">
            <Button
              className="hover:bg-slate-100 dark:hover:bg-[#161b22] text-slate-700 dark:text-[#8b949e]"
              variant="ghost"
              size="sm"
              onClick={addColumn}
              disabled={busy || loading}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Menu trois points pour l'image de fond du board */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-100 dark:hover:bg-[#161b22] text-slate-700 dark:text-[#8b949e]"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    document.getElementById('board-bg-upload')?.click();
                  }}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Changer l'image de fond
                </DropdownMenuItem>
                {boardBackground && (
                  <DropdownMenuItem
                    onClick={() => removeBackgroundImage()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Retirer l'image de fond
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Input caché pour upload d'image */}
            <input
              id="board-bg-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundImageUpload}
            />
          </div>
        </div>

        {error && (
          <div className="px-4 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div
          className="flex-1 p-4 rounded-b-lg overflow-auto relative"
          style={{
            backgroundImage: boardBackground ? `url(${boardBackground})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: boardBackground ? 'transparent' : undefined
          }}
        >
          {/* Overlay adaptatif selon le mode clair/sombre - plus transparent en mode clair */}
          {boardBackground && (
            <div className="absolute inset-0 bg-white/30 dark:bg-black/40 pointer-events-none z-0" />
          )}

          <div className="flex gap-3 items-start flex-nowrap max-[720px]:flex-wrap max-[720px]:overflow-visible overflow-x-auto pb-4 divide-x divide-slate-100 dark:divide-transparent relative z-10">
            {containers.map((col) => {
              const isEditing = editingId === col.id;
              const itemsInCol = todos.filter((t) => t.container_id === col.id);
              return (
                <UICard
                  key={col.id}
                  draggable
                  onDragStart={onContainerDragStart(col.id)}
                  onDragOver={onDragOver}
                  onDrop={onContainerDrop(col.id)}
                  className="shadow-sm justify-start flex-none min-w-[280px] bg-white dark:bg-[#1c2128] border-t-8 dark:border-[#30363d] rounded-lg hover:shadow-md border-slate-300 transition-colors cursor-move relative z-10"
                  style={{
                    borderTopColor: (col as any).color ?? undefined
                  }}
                >
                  <div className="flex items-start">

                    <div onClick={() => !isEditing && startEdit(col)} className="cursor-pointer flex-1">
                      <CardHeader>
                        {isEditing ? (
                          <div className="flex gap-2 items-center">
                            <input
                              value={draftTitle}
                              onChange={(e) => setDraftTitle(e.target.value)}
                              className="w-full text-sm font-medium border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(col.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <input type="color" value={draftColor} onChange={(e) => setDraftColor(e.target.value)} className="w-8 h-8" />
                          </div>
                        ) : (
                          <CardTitle className="text-sm text-slate-900 dark:text-[#c9d1d9] font-semibold">{col.title}</CardTitle>
                        )}
                      </CardHeader>
                      <CardContent
                        className="text-sm dark:text-slate-300"
                        onDragOver={onDragOver}
                        onDrop={onDropToColumn(col.id)}
                      >
                        {itemsInCol.length === 0 ? (
                          <div className="text-xs text-muted-foreground dark:text-[#8b949e] border-2 border-dashed border-slate-300 dark:border-[#30363d] rounded-lg p-4 bg-slate-100 dark:bg-[#161b22]">
                            Drag cards here
                          </div>
                        ) : (
                          <ul className="flex flex-col gap-2">
                            {itemsInCol.map((it) => (
                              <li
                                key={it.id}
                                data-etodo-task="true"
                                draggable
                                onDragStart={onDragStartFromColumn(it.id)}
                                onMouseEnter={() => setHoveredTodoId(it.id)}
                                onMouseLeave={() => setHoveredTodoId(null)}
                                className="text-sm px-3 py-3 rounded-lg border-l-4 border-l-slate-400 dark:border-l-[#58a6ff] border border-slate-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all relative group"
                                style={{ borderLeftColor: it.color ?? undefined }}
                              >
                                {editingTodoId === it.id ? (
                                  <div>
                                    <input
                                      value={todoDraftTitle}
                                      onChange={(e) => setTodoDraftTitle(e.target.value)}
                                      className="w-full text-sm font-medium border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] mb-2"
                                      autoFocus
                                    />
                                    <textarea
                                      value={todoDraftBody}
                                      onChange={(e) => setTodoDraftBody(e.target.value)}
                                      className="w-full text-sm border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9] mb-2"
                                      rows={3}
                                    />
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="time"
                                        value={todoDraftDueTime}
                                        onChange={(e) => setTodoDraftDueTime(e.target.value)}
                                        className="text-sm border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9]"
                                      />
                                      <select
                                        value={todoDraftState}
                                        onChange={(e) => setTodoDraftState(e.target.value as any)}
                                        className="text-sm border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 bg-white dark:bg-[#161b22] dark:text-[#c9d1d9]"
                                      >
                                        <option value="not started">Not Started</option>
                                        <option value="todo">To Do</option>
                                        <option value="in progress">In Progress</option>
                                        <option value="done">Done</option>
                                      </select>
                                      <input type="color" value={todoDraftColor} onChange={(e) => setTodoDraftColor(e.target.value)} className="ml-2 w-8 h-8 border-none" />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                      <Button size="sm" onClick={() => saveEditTodo(it.id)}>Save</Button>
                                      <Button size="sm" variant="ghost" onClick={cancelEditTodo}>Cancel</Button>
                                      <Button size="sm" variant="destructive" onClick={() => removeTodo(it.id)}>Delete</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => startEditTodo(it)}
                                    className={`cursor-pointer transition-all ${hoveredTodoId === it.id ? 'mr-8' : ''}`}
                                  >
                                    <div className={`font-semibold flex items-center gap-2 transition-all ${it.status === 'done' ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
                                      {it.title}
                                      {((it.rewardGemsMin ?? 0) > 0 && (it.rewardGemsMax ?? 0) > 0) && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1. 5 py-0.5" title={`Récompense aléatoire: ${it.rewardGemsMin}-${it.rewardGemsMax}`}>
                                          <img src="/clash/image_fond/gems-icon-r-removebg-preview.png" alt="Gemme" className="w-6 h-6 object-contain" />
                                        </span>
                                      )}
                                    </div>
                                    {/* Description masquée par défaut dans le board */}
                                    <div className="text-xs text-slate-500 dark:text-[#8b949e] mt-1 flex items-center justify-between">
                                      <div>{it.due_time ? new Date(it.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</div>
                                      <div className="ml-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0f1724] text-[11px]">{it.status}</div>
                                    </div>
                                  </div>
                                )}

                                {/* Checkbox qui apparaît au survol */}
                                {editingTodoId !== it.id && (
                                  <div
                                    onClick={(e) => toggleTodoDone(it, e)}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-300 flex items-center justify-center ${hoveredTodoId === it.id
                                      ? 'opacity-100 translate-x-0'
                                      : 'opacity-0 translate-x-4 pointer-events-none'
                                      } ${it.status === 'done'
                                        ? 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700'
                                        : 'bg-white dark:bg-[#161b22] border-slate-400 dark:border-[#30363d] hover:border-green-500 dark:hover:border-green-600'
                                      }`}
                                  >
                                    {it.status === 'done' && (
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                )}

                                {/* Bouton voir en grand (détails) */}
                                {editingTodoId !== it.id && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openTodoDetail(it.id); }}
                                    title="Voir les détails"
                                    className={`absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border cursor-pointer transition-all duration-300 flex items-center justify-center bg-white dark:bg-[#161b22] border-slate-300 dark:border-[#30363d] hover:bg-slate-100 dark:hover:bg-[#0f1724] ${hoveredTodoId === it.id
                                      ? 'opacity-100 translate-x-0'
                                      : 'opacity-0 translate-x-4 pointer-events-none'
                                      }`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex p-4 gap-2 flex-wrap border-t border-slate-200 dark:border-[#30363d]">
                      <Button className="flex-1 min-w-[80px]" size="sm" onClick={() => saveEdit(col.id)} disabled={busy}>
                        Save
                      </Button>
                      <Button className="flex-1 min-w-[80px]" size="sm" variant="ghost" onClick={cancelEdit} disabled={busy}>
                        Cancel
                      </Button>
                      <Button
                        className="w-full mt-1"
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteColumnHandler(col.id)}
                        disabled={busy}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </UICard>
              );
            })}
          </div>
        </div>
      </aside>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {detailLoading ? 'Chargement…' : (detailTodo?.title || 'Détails de la tâche')}
            </DialogTitle>
            {!detailLoading && detailError && (
              <DialogDescription className="text-red-600">{detailError}</DialogDescription>
            )}
          </DialogHeader>
          {!detailLoading && detailTodo && (
            <div className="space-y-3">
              {detailTodo.description && (
                <p className="text-sm whitespace-pre-wrap">{detailTodo.description}</p>
              )}
              <div className="text-sm grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Statut:</span> {detailTodo.status}</div>
                {detailTodo.due_time && (
                  <div><span className="text-muted-foreground">Échéance:</span> {new Date(detailTodo.due_time).toLocaleString()}</div>
                )}
                {detailTodo.color && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Couleur:</span>
                    <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: detailTodo.color }} />
                  </div>
                )}
                {detailTodo.created_at && (
                  <div><span className="text-muted-foreground">Créée:</span> {new Date(detailTodo.created_at).toLocaleString()}</div>
                )}
                {detailTodo.updated_at && (
                  <div><span className="text-muted-foreground">Modifiée:</span> {new Date(detailTodo.updated_at).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}