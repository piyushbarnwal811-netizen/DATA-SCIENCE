"use client";

import { useState, useEffect } from "react";
import {
  DoorOpen,
  Plus,
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Sparkles,
  Laptop,
  Check,
  ArrowRight,
  Layers
} from "lucide-react";
import api from "../../services/api.js";

export default function ClassroomAllocationView({ canManage = true }) {
  const [classrooms, setClassrooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

  // Create room modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    roomNumber: "",
    name: "",
    building: "Engineering Block A",
    floor: "1st Floor",
    type: "Classroom",
    capacity: 60,
    workstationsCount: 0,
    hasProjector: true,
    hasSmartBoard: true,
    hasAirConditioning: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, secsRes] = await Promise.all([
        api.get("/hierarchy/classrooms"),
        api.get("/hierarchy/sections")
      ]);
      setClassrooms(roomsRes.data.classrooms || []);
      setSections(secsRes.data.sections || []);
    } catch (err) {
      console.error("Error loading classroom data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (room) => {
    setSelectedRoom(room);
    // Find current section if any
    const currSec = sections.find(
      (s) => String(s.primaryClassroomId?._id || s.primaryClassroomId) === String(room._id)
    );
    setSelectedSectionId(currSec ? currSec._id : "");
    setAssignSuccess("");
    setAssignError("");
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !selectedSectionId) return;
    setAssigning(true);
    setAssignError("");
    setAssignSuccess("");

    try {
      const res = await api.post("/hierarchy/classrooms/assign", {
        classroomId: selectedRoom._id,
        sectionId: selectedSectionId
      });
      setAssignSuccess(res.data.message || "Classroom allocated successfully!");
      await fetchData();
      setTimeout(() => {
        setAssignModalOpen(false);
        setAssignSuccess("");
      }, 1000);
    } catch (err) {
      setAssignError(err.response?.data?.message || "Failed to allocate classroom.");
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/hierarchy/classrooms", newRoomData);
      await fetchData();
      setCreateModalOpen(false);
      setNewRoomData({
        roomNumber: "",
        name: "",
        building: "Engineering Block A",
        floor: "1st Floor",
        type: "Classroom",
        capacity: 60,
        workstationsCount: 0,
        hasProjector: true,
        hasSmartBoard: true,
        hasAirConditioning: true
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create room.");
    } finally {
      setCreating(false);
    }
  };

  // Find which section occupies which room
  const getAssignedSection = (roomId) => {
    return sections.find(
      (s) => String(s.primaryClassroomId?._id || s.primaryClassroomId) === String(roomId)
    );
  };

  const buildings = [...new Set(classrooms.map((c) => c.building).filter(Boolean))];

  const filteredClassrooms = classrooms.filter((c) => {
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchBuilding = buildingFilter === "all" || c.building === buildingFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.roomNumber?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.building?.toLowerCase().includes(q);
    return matchType && matchBuilding && matchSearch;
  });

  const totalRooms = classrooms.length;
  const allocatedRoomsCount = classrooms.filter((c) => getAssignedSection(c._id)).length;
  const totalLabs = classrooms.filter((c) => c.type.toLowerCase().includes("lab")).length;

  return (
    <div className="classroom-allocation-container space-y-4">
      {/* Top Header */}
      <div className="timetable-top-bar">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
              <DoorOpen size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Classroom & Computer Lab Inventory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical lecture halls, smart classrooms, and coding labs allocated to student cohorts.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="button button--primary text-xs py-1.5 px-3 h-8 gap-1.5"
          >
            <Plus size={14} />
            <span>Add Classroom / Lab</span>
          </button>
        )}
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Rooms</span>
          <strong className="text-lg font-bold text-slate-800">{totalRooms}</strong>
          <span className="text-[11px] text-slate-500 block">Classrooms & Labs</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Allocated to Sections</span>
          <strong className="text-lg font-bold text-emerald-700">{allocatedRoomsCount}</strong>
          <span className="text-[11px] text-slate-500 block">Active Student Cohorts</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Available / Unassigned</span>
          <strong className="text-lg font-bold text-slate-700">{totalRooms - allocatedRoomsCount}</strong>
          <span className="text-[11px] text-slate-500 block">Free for Assignment</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Computer Labs</span>
          <strong className="text-lg font-bold text-indigo-700">{totalLabs}</strong>
          <span className="text-[11px] text-slate-500 block">With Systems & Workstations</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="timetable-filters-row">
        <div className="visualizer-search-box flex-1 max-w-xs">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search room number, building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="visualizer-filter-select">
            <Filter size={13} className="text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Room Types</option>
              <option value="Classroom">Classrooms</option>
              <option value="Lecture Hall">Lecture Halls</option>
              <option value="Computer Lab">Computer Labs</option>
              <option value="Seminar Hall">Seminar Halls</option>
            </select>
          </div>

          <div className="visualizer-filter-select">
            <Building size={13} className="text-slate-400" />
            <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
              <option value="all">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-500 text-xs">
            <Sparkles size={20} className="animate-spin text-rose-500 mx-auto mb-2" />
            Loading classrooms & laboratories...
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 text-xs">
            <DoorOpen size={24} className="text-slate-300 mx-auto mb-2" />
            No classrooms match your filter selection.
          </div>
        ) : (
          filteredClassrooms.map((room) => {
            const assignedSec = getAssignedSection(room._id);
            const isLab = room.type.toLowerCase().includes("lab");

            return (
              <div
                key={room._id}
                className={`p-3.5 bg-white border rounded-xl shadow-sm hover:shadow transition flex flex-col justify-between ${
                  assignedSec ? "border-emerald-200" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                        {room.roomNumber}
                      </span>
                      <strong className="block text-sm font-bold text-slate-800 mt-1">
                        {room.name || room.type}
                      </strong>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        assignedSec
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {assignedSec ? "Allocated" : "Available"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    {room.building} · {room.floor}
                  </p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      Capacity: {room.capacity} Seats
                    </span>
                    {isLab && room.workstationsCount > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded flex items-center gap-1">
                        <Laptop size={11} /> {room.workstationsCount} Systems
                      </span>
                    )}
                    {room.hasAirConditioning && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 rounded">
                        AC
                      </span>
                    )}
                    {room.hasSmartBoard && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                        Smart Board
                      </span>
                    )}
                  </div>
                </div>

                {/* Allocation Box */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  {assignedSec ? (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Section</span>
                      <strong className="text-xs font-bold text-indigo-700">
                        {assignedSec.name}
                      </strong>
                      <span className="text-[10px] text-slate-500 block">
                        Year {assignedSec.year} · {assignedSec.totalStudents} Students
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                      <span className="text-xs font-medium text-slate-600 italic">
                        Not assigned to any cohort
                      </span>
                    </div>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openAssignModal(room)}
                      className="button button--white text-[11px] py-1 px-2.5 h-7"
                    >
                      {assignedSec ? "Reassign" : "Assign Section"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Room to Section Modal */}
      {assignModalOpen && selectedRoom && (
        <div className="hierarchy-modal-backdrop" onClick={() => setAssignModalOpen(false)}>
          <div className="hierarchy-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hierarchy-modal-header bg-gradient-to-r from-rose-600 to-pink-600">
              <div>
                <span className="modal-level-tag">ROOM ALLOCATION</span>
                <h2 className="modal-node-title">
                  Allocate {selectedRoom.roomNumber} ({selectedRoom.type})
                </h2>
                <p className="modal-node-subtitle">
                  Assign this physical classroom / lab as the primary room for a student section
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="hierarchy-modal-body space-y-3">
              {assignError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>{assignError}</span>
                </div>
              )}
              {assignSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <div>
                  <span className="text-slate-500 font-medium">Selected Room: </span>
                  <strong className="text-slate-800">{selectedRoom.roomNumber} ({selectedRoom.name || selectedRoom.type})</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Location: </span>
                  <span>{selectedRoom.building} · {selectedRoom.floor}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Seating Capacity: </span>
                  <strong className="text-slate-800">{selectedRoom.capacity} Students</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Choose Section / Class to Allocate *
                </label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded bg-white font-medium"
                >
                  <option value="">-- Select Section / Class --</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.departmentId?.name || "Dept"} · Year {s.year} · {s.totalStudents} Students)
                    </option>
                  ))}
                </select>
              </div>

              <div className="hierarchy-modal-footer mt-4">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="button button--white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="button button--primary"
                >
                  {assigning ? "Saving..." : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Classroom Modal */}
      {createModalOpen && (
        <div className="hierarchy-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="hierarchy-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hierarchy-modal-header bg-gradient-to-r from-rose-600 to-pink-600">
              <div>
                <span className="modal-level-tag">INVENTORY</span>
                <h2 className="modal-node-title">Add New Classroom / Computer Lab</h2>
                <p className="modal-node-subtitle">Register physical university room details</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="hierarchy-modal-body space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROOM-101, LAB-204"
                    value={newRoomData.roomNumber}
                    onChange={(e) => setNewRoomData({ ...newRoomData, roomNumber: e.target.value })}
                    className="w-full text-xs p-2 border rounded font-mono uppercase bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Name / Label</label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Cloud Lab, Lecture Hall 1"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type *</label>
                  <select
                    value={newRoomData.type}
                    onChange={(e) => setNewRoomData({ ...newRoomData, type: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white font-medium"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seating Capacity *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newRoomData.capacity}
                    onChange={(e) => setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Workstations Count</label>
                  <input
                    type="number"
                    min={0}
                    value={newRoomData.workstationsCount}
                    onChange={(e) => setNewRoomData({ ...newRoomData, workstationsCount: Number(e.target.value) })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Building *</label>
                  <input
                    type="text"
                    required
                    value={newRoomData.building}
                    onChange={(e) => setNewRoomData({ ...newRoomData, building: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor *</label>
                  <input
                    type="text"
                    required
                    value={newRoomData.floor}
                    onChange={(e) => setNewRoomData({ ...newRoomData, floor: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Amenities</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomData.hasAirConditioning}
                      onChange={(e) => setNewRoomData({ ...newRoomData, hasAirConditioning: e.target.checked })}
                    />
                    <span>Air Conditioning</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomData.hasSmartBoard}
                      onChange={(e) => setNewRoomData({ ...newRoomData, hasSmartBoard: e.target.checked })}
                    />
                    <span>Smart Board</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoomData.hasProjector}
                      onChange={(e) => setNewRoomData({ ...newRoomData, hasProjector: e.target.checked })}
                    />
                    <span>Projector</span>
                  </label>
                </div>
              </div>

              <div className="hierarchy-modal-footer mt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="button button--white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="button button--primary"
                >
                  {creating ? "Adding..." : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
