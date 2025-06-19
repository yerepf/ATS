using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ATS_WinForms
{
    public partial class Menu: Form
    {
        string user;

        public Menu(string usuario)
        {
            InitializeComponent();
            user = usuario;
        }

        private void Menu_FormClosing(object sender, FormClosingEventArgs e)
        {
            Application.Exit();
        }

        private void btnReportes_Click(object sender, EventArgs e)
        {

        }

        private void btnExit_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void abrirFormPanel(object formhija)
        {
            if (this.PanelContenedor.Controls.Count > 0)
                this.PanelContenedor.Controls.RemoveAt(0);
            Form fh = formhija as Form;
            fh.TopLevel = false;
            fh.Dock = DockStyle.Fill;
            this.PanelContenedor.Controls.Add(fh);
            this.PanelContenedor.Tag = fh;
            fh.Show();
        }

        private void btnAsistencia_Click(object sender, EventArgs e)
        {
            abrirFormPanel(new Asistencia());
        }

        private void btnHuella_Click(object sender, EventArgs e)
        {
            abrirFormPanel(new Huella());       
        }

        private void panelLogo_Paint(object sender, PaintEventArgs e)
        {

        }

        private void Panel_Paint(object sender, PaintEventArgs e)
        {
            lbMaestro.Text = user;
        }
    }
}
