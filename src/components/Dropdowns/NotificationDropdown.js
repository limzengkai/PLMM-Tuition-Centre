import React, { useState, useEffect, useRef, useContext } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { AuthContext } from "../../config/context/AuthContext";
import { db } from "../../config/firebase";
// import { CardSoundNotification } from "../Cards/CardSoundNotification"

const NotificationDropdown = () => {
  const [dropdownPopoverShow, setDropdownPopoverShow] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [visibleNotifications, setVisibleNotifications] = useState(5);
  const [newNotificationSound, setNewNotificationSound] = useState(false);
  const btnDropdownRef = useRef(null);
  const popoverDropdownRef = useRef(null);

  const currentUser = useContext(AuthContext);

  useEffect(() => {
    if (currentUser && currentUser.currentUser) {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.currentUser.uid)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const newNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(newNotifications);

        // Trigger sound when a new notification arrives
        if (newNotifications.length > notifications.length) {
          setNewNotificationSound(true);
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (newNotificationSound) {
      // Reset sound trigger after 1 second
      const timeout = setTimeout(() => {
        setNewNotificationSound(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [newNotificationSound]);

  const toggleDropdownPopover = () => {
    setDropdownPopoverShow(!dropdownPopoverShow);
  };

  // Attach event listener to close the dropdown when clicking outside of it
  useEffect(() => {
    const closeDropdownWhenClickOutside = (event) => {
      if (
        btnDropdownRef.current &&
        !btnDropdownRef.current.contains(event.target) &&
        popoverDropdownRef.current &&
        !popoverDropdownRef.current.contains(event.target)
      ) {
        setDropdownPopoverShow(false);
      }
    };

    document.addEventListener("mousedown", closeDropdownWhenClickOutside);

    return () => {
      document.removeEventListener("mousedown", closeDropdownWhenClickOutside);
    };
  }, []);

  // Calculate the number of unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Function to mark notification as read
  const markAsRead = async (id) => {
    try {
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  };

  // Function to load more notifications
  const loadMoreNotifications = () => {
    setVisibleNotifications((prevVisible) => Math.min(prevVisible + 5, 10));
  };

  // Sort notifications: unread first, then by timestamp
  const sortedNotifications = notifications.sort((a, b) => {
    if (!a.isRead && b.isRead) return -1;
    if (a.isRead && !b.isRead) return 1;
    return b.AddTime.toDate() - a.AddTime.toDate();
  });

  return (
    <div className="relative border-0 p-0">
      {/* {newNotificationSound && (
        <CardSoundNotification soundFile="/path/to/notification_sound.mp3" />
      )} */}
      <button
        className="border-0 p-0 relative"
        ref={btnDropdownRef}
        onClick={toggleDropdownPopover}
      >
        <div className="items-center flex">
          <div className="border-0 p-0"> &nbsp; </div>
          <i className="fas fa-bell fa-lg">&nbsp;</i>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {dropdownPopoverShow && (
        <div
          className="absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-64 z-50"
          ref={popoverDropdownRef}
        >
          <div className="py-3 px-4">
            <span className="block text-sm text-gray-900">Notifications</span>
          </div>
          <div className="pt-2 max-h-64 overflow-y-auto">
            {sortedNotifications.length > 0 ? (
              sortedNotifications
                .slice(0, visibleNotifications)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-2 text-sm ${
                      notification.isRead
                        ? "bg-white text-gray-700"
                        : "bg-gray-500 text-white"
                    } hover:text-white dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="max-h-16 overflow-y-auto">
                      {notification.message}
                    </div>
                    <div
                      className={`${
                        notification.isRead
                          ? "text-gray-600 hover:text-white"
                          : "text-white"
                      }`}
                    >
                      <small>
                        {formatDistanceToNow(
                          new Date(notification.AddTime.toDate()),
                          { addSuffix: true }
                        )}
                      </small>
                    </div>
                  </div>
                ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-700">
                No notifications
              </div>
            )}
            {visibleNotifications < sortedNotifications.length &&
              visibleNotifications < 10 && (
                <div
                  className="px-4 py-2 text-sm text-center text-blue-500 cursor-pointer"
                  onClick={loadMoreNotifications}
                >
                  See more notifications
                </div>
              )}
            {sortedNotifications.length > 10 && visibleNotifications >= 10 && (
              <Link
                to={"/notifications"}
                className="px-4 py-2 text-sm text-center text-blue-500 cursor-pointer"
              >
                See all notifications
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
