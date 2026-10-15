export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <p>
          <a href="https://calecutech.com/terms">Terms</a>
          <a href="https://calecutech.com/privacy">Privacy</a>
          <a href="https://calecutech.com/refund-policy">Refunds</a>
          <a href="https://calecutech.com/contact">Contact</a>
        </p>
        <p>
          PMP, PMI and PMBOK are registered marks of the Project Management Institute, Inc. This product
          is not affiliated with, endorsed by, or sponsored by PMI. All practice questions are original.
        </p>
        <p>© {new Date().getFullYear()} Calecute Technologies</p>
      </div>
    </footer>
  );
}
