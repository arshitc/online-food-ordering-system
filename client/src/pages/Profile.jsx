import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveProfile } from "../redux/authSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
    addresses: user?.addresses || []
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch(saveProfile(form));
  };

  return (
    <section className="form-page">
      <form className="form-card" onSubmit={submitHandler}>
        <h2>Profile</h2>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="Avatar URL" />
        <button className="button">Save Profile</button>
      </form>
    </section>
  );
};

export default Profile;

