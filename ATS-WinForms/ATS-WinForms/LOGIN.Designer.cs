namespace ATS_WinForms
{
    partial class LOGIN
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(LOGIN));
            this.BT_ENTRAR = new Guna.UI2.WinForms.Guna2Button();
            this.panel2 = new System.Windows.Forms.Panel();
            this.MostrarClave = new Guna.UI2.WinForms.Guna2CirclePictureBox();
            this.label1 = new System.Windows.Forms.Label();
            this.TB_CLAVE = new Guna.UI2.WinForms.Guna2TextBox();
            this.TB_USUARIO = new Guna.UI2.WinForms.Guna2TextBox();
            this.guna2HtmlLabel2 = new Guna.UI2.WinForms.Guna2HtmlLabel();
            this.guna2HtmlLabel1 = new Guna.UI2.WinForms.Guna2HtmlLabel();
            this.BT_SALIR = new Guna.UI2.WinForms.Guna2Button();
            this.panel1 = new System.Windows.Forms.Panel();
            this.panel2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.MostrarClave)).BeginInit();
            this.SuspendLayout();
            // 
            // BT_ENTRAR
            // 
            this.BT_ENTRAR.Animated = true;
            this.BT_ENTRAR.BackColor = System.Drawing.Color.Transparent;
            this.BT_ENTRAR.BorderRadius = 8;
            this.BT_ENTRAR.DisabledState.BorderColor = System.Drawing.Color.DarkGray;
            this.BT_ENTRAR.DisabledState.CustomBorderColor = System.Drawing.Color.DarkGray;
            this.BT_ENTRAR.DisabledState.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(169)))), ((int)(((byte)(169)))), ((int)(((byte)(169)))));
            this.BT_ENTRAR.DisabledState.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(141)))), ((int)(((byte)(141)))), ((int)(((byte)(141)))));
            this.BT_ENTRAR.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(219)))), ((int)(((byte)(1)))), ((int)(((byte)(28)))));
            this.BT_ENTRAR.Font = new System.Drawing.Font("Roboto Black", 20.25F, System.Drawing.FontStyle.Bold);
            this.BT_ENTRAR.ForeColor = System.Drawing.Color.White;
            this.BT_ENTRAR.Location = new System.Drawing.Point(370, 288);
            this.BT_ENTRAR.Name = "BT_ENTRAR";
            this.BT_ENTRAR.PressedColor = System.Drawing.Color.Silver;
            this.BT_ENTRAR.Size = new System.Drawing.Size(113, 36);
            this.BT_ENTRAR.TabIndex = 1;
            this.BT_ENTRAR.Text = "Entrar";
            this.BT_ENTRAR.Click += new System.EventHandler(this.BT_ENTRAR_Click);
            // 
            // panel2
            // 
            this.panel2.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(219)))), ((int)(((byte)(1)))), ((int)(((byte)(28)))));
            this.panel2.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
            this.panel2.Controls.Add(this.MostrarClave);
            this.panel2.Controls.Add(this.label1);
            this.panel2.Controls.Add(this.TB_CLAVE);
            this.panel2.Controls.Add(this.TB_USUARIO);
            this.panel2.Controls.Add(this.guna2HtmlLabel2);
            this.panel2.Controls.Add(this.guna2HtmlLabel1);
            this.panel2.Location = new System.Drawing.Point(370, 12);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(262, 260);
            this.panel2.TabIndex = 3;
            // 
            // MostrarClave
            // 
            this.MostrarClave.FillColor = System.Drawing.Color.Transparent;
            this.MostrarClave.Image = global::ATS_WinForms.Properties.Resources.foto;
            this.MostrarClave.ImageRotate = 0F;
            this.MostrarClave.Location = new System.Drawing.Point(203, 195);
            this.MostrarClave.Name = "MostrarClave";
            this.MostrarClave.ShadowDecoration.Mode = Guna.UI2.WinForms.Enums.ShadowMode.Circle;
            this.MostrarClave.Size = new System.Drawing.Size(40, 35);
            this.MostrarClave.SizeMode = System.Windows.Forms.PictureBoxSizeMode.StretchImage;
            this.MostrarClave.TabIndex = 5;
            this.MostrarClave.TabStop = false;
            this.MostrarClave.Click += new System.EventHandler(this.MostrarClave_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Roboto Black", 24F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.ForeColor = System.Drawing.Color.White;
            this.label1.Location = new System.Drawing.Point(7, 10);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(247, 38);
            this.label1.TabIndex = 4;
            this.label1.Text = "Inicio de Sesión";
            // 
            // TB_CLAVE
            // 
            this.TB_CLAVE.Animated = true;
            this.TB_CLAVE.BorderColor = System.Drawing.Color.Empty;
            this.TB_CLAVE.BorderRadius = 8;
            this.TB_CLAVE.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.TB_CLAVE.DefaultText = "";
            this.TB_CLAVE.DisabledState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(208)))), ((int)(((byte)(208)))), ((int)(((byte)(208)))));
            this.TB_CLAVE.DisabledState.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(226)))), ((int)(((byte)(226)))), ((int)(((byte)(226)))));
            this.TB_CLAVE.DisabledState.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(138)))), ((int)(((byte)(138)))), ((int)(((byte)(138)))));
            this.TB_CLAVE.DisabledState.PlaceholderForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(138)))), ((int)(((byte)(138)))), ((int)(((byte)(138)))));
            this.TB_CLAVE.FocusedState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(94)))), ((int)(((byte)(148)))), ((int)(((byte)(255)))));
            this.TB_CLAVE.Font = new System.Drawing.Font("Roboto", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.TB_CLAVE.ForeColor = System.Drawing.Color.Black;
            this.TB_CLAVE.HoverState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(94)))), ((int)(((byte)(148)))), ((int)(((byte)(255)))));
            this.TB_CLAVE.Location = new System.Drawing.Point(14, 195);
            this.TB_CLAVE.Margin = new System.Windows.Forms.Padding(5, 5, 5, 5);
            this.TB_CLAVE.MaxLength = 10;
            this.TB_CLAVE.Name = "TB_CLAVE";
            this.TB_CLAVE.PasswordChar = '*';
            this.TB_CLAVE.PlaceholderText = "";
            this.TB_CLAVE.SelectedText = "";
            this.TB_CLAVE.Size = new System.Drawing.Size(184, 35);
            this.TB_CLAVE.TabIndex = 3;
            this.TB_CLAVE.KeyDown += new System.Windows.Forms.KeyEventHandler(this.TB_CLAVE_KeyDown);
            // 
            // TB_USUARIO
            // 
            this.TB_USUARIO.Animated = true;
            this.TB_USUARIO.BorderColor = System.Drawing.Color.Empty;
            this.TB_USUARIO.BorderRadius = 8;
            this.TB_USUARIO.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.TB_USUARIO.DefaultText = "";
            this.TB_USUARIO.DisabledState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(208)))), ((int)(((byte)(208)))), ((int)(((byte)(208)))));
            this.TB_USUARIO.DisabledState.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(226)))), ((int)(((byte)(226)))), ((int)(((byte)(226)))));
            this.TB_USUARIO.DisabledState.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(138)))), ((int)(((byte)(138)))), ((int)(((byte)(138)))));
            this.TB_USUARIO.DisabledState.PlaceholderForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(138)))), ((int)(((byte)(138)))), ((int)(((byte)(138)))));
            this.TB_USUARIO.FocusedState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(94)))), ((int)(((byte)(148)))), ((int)(((byte)(255)))));
            this.TB_USUARIO.Font = new System.Drawing.Font("Roboto", 15.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.TB_USUARIO.ForeColor = System.Drawing.Color.Black;
            this.TB_USUARIO.HoverState.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(94)))), ((int)(((byte)(148)))), ((int)(((byte)(255)))));
            this.TB_USUARIO.Location = new System.Drawing.Point(14, 98);
            this.TB_USUARIO.Margin = new System.Windows.Forms.Padding(5, 5, 5, 5);
            this.TB_USUARIO.MaxLength = 10;
            this.TB_USUARIO.Name = "TB_USUARIO";
            this.TB_USUARIO.PasswordChar = '\0';
            this.TB_USUARIO.PlaceholderText = "";
            this.TB_USUARIO.SelectedText = "";
            this.TB_USUARIO.Size = new System.Drawing.Size(229, 35);
            this.TB_USUARIO.TabIndex = 2;
            this.TB_USUARIO.KeyDown += new System.Windows.Forms.KeyEventHandler(this.TB_USUARIO_KeyDown);
            // 
            // guna2HtmlLabel2
            // 
            this.guna2HtmlLabel2.BackColor = System.Drawing.Color.Transparent;
            this.guna2HtmlLabel2.Font = new System.Drawing.Font("Roboto", 20.25F, System.Drawing.FontStyle.Italic, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.guna2HtmlLabel2.ForeColor = System.Drawing.Color.White;
            this.guna2HtmlLabel2.Location = new System.Drawing.Point(14, 162);
            this.guna2HtmlLabel2.Name = "guna2HtmlLabel2";
            this.guna2HtmlLabel2.Size = new System.Drawing.Size(67, 35);
            this.guna2HtmlLabel2.TabIndex = 1;
            this.guna2HtmlLabel2.Text = "Clave";
            // 
            // guna2HtmlLabel1
            // 
            this.guna2HtmlLabel1.BackColor = System.Drawing.Color.Transparent;
            this.guna2HtmlLabel1.Font = new System.Drawing.Font("Roboto", 20.25F, System.Drawing.FontStyle.Italic, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.guna2HtmlLabel1.ForeColor = System.Drawing.Color.White;
            this.guna2HtmlLabel1.Location = new System.Drawing.Point(14, 66);
            this.guna2HtmlLabel1.Name = "guna2HtmlLabel1";
            this.guna2HtmlLabel1.Size = new System.Drawing.Size(92, 35);
            this.guna2HtmlLabel1.TabIndex = 0;
            this.guna2HtmlLabel1.Text = "Usuario";
            // 
            // BT_SALIR
            // 
            this.BT_SALIR.Animated = true;
            this.BT_SALIR.BorderRadius = 8;
            this.BT_SALIR.DisabledState.BorderColor = System.Drawing.Color.DarkGray;
            this.BT_SALIR.DisabledState.CustomBorderColor = System.Drawing.Color.DarkGray;
            this.BT_SALIR.DisabledState.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(169)))), ((int)(((byte)(169)))), ((int)(((byte)(169)))));
            this.BT_SALIR.DisabledState.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(141)))), ((int)(((byte)(141)))), ((int)(((byte)(141)))));
            this.BT_SALIR.FillColor = System.Drawing.Color.FromArgb(((int)(((byte)(219)))), ((int)(((byte)(1)))), ((int)(((byte)(28)))));
            this.BT_SALIR.Font = new System.Drawing.Font("Roboto Black", 20.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.BT_SALIR.ForeColor = System.Drawing.Color.White;
            this.BT_SALIR.Location = new System.Drawing.Point(519, 288);
            this.BT_SALIR.Name = "BT_SALIR";
            this.BT_SALIR.Size = new System.Drawing.Size(113, 36);
            this.BT_SALIR.TabIndex = 4;
            this.BT_SALIR.Text = "Salir";
            this.BT_SALIR.Click += new System.EventHandler(this.BT_SALIR_Click);
            // 
            // panel1
            // 
            this.panel1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(219)))), ((int)(((byte)(1)))), ((int)(((byte)(28)))));
            this.panel1.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("panel1.BackgroundImage")));
            this.panel1.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.panel1.Location = new System.Drawing.Point(-1, 0);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(347, 341);
            this.panel1.TabIndex = 0;
            // 
            // LOGIN
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(248)))), ((int)(((byte)(249)))), ((int)(((byte)(250)))));
            this.ClientSize = new System.Drawing.Size(653, 339);
            this.Controls.Add(this.BT_SALIR);
            this.Controls.Add(this.panel2);
            this.Controls.Add(this.BT_ENTRAR);
            this.Controls.Add(this.panel1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.Name = "LOGIN";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "LOGIN";
            this.panel2.ResumeLayout(false);
            this.panel2.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.MostrarClave)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel panel1;
        private Guna.UI2.WinForms.Guna2Button BT_ENTRAR;
        private System.Windows.Forms.Panel panel2;
        private Guna.UI2.WinForms.Guna2TextBox TB_USUARIO;
        private Guna.UI2.WinForms.Guna2HtmlLabel guna2HtmlLabel2;
        private Guna.UI2.WinForms.Guna2HtmlLabel guna2HtmlLabel1;
        private Guna.UI2.WinForms.Guna2TextBox TB_CLAVE;
        private System.Windows.Forms.Label label1;
        private Guna.UI2.WinForms.Guna2Button BT_SALIR;
        private Guna.UI2.WinForms.Guna2CirclePictureBox MostrarClave;
    }
}

